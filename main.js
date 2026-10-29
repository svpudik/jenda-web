import { firebaseConfig } from "./firebase-config.js";

const firebaseVersion = "10.12.2";
const ui = {
  accountDetails: document.querySelector("#accountDetails"),
  accountName: document.querySelector("#accountName"),
  accountUid: document.querySelector("#accountUid"),
  composer: document.querySelector("#composerSection"),
  copyUid: document.querySelector("#copyUidButton"),
  friendForm: document.querySelector("#friendForm"),
  friendInput: document.querySelector("#friendUidInput"),
  friends: document.querySelector("#friendsList"),
  friendsSection: document.querySelector("#friendsSection"),
  postCount: document.querySelector("#postCount"),
  postForm: document.querySelector("#postForm"),
  posts: document.querySelector("#postsList"),
  setupNotice: document.querySelector("#setupNotice"),
  signIn: document.querySelector("#signInButton"),
  signOut: document.querySelector("#signOutButton"),
  signedOut: document.querySelector("#signedOutMessage"),
  status: document.querySelector("#statusMessage")
};

let auth;
let database;
let currentUser;
let friendIds = [];
let firebaseReady = false;

function showStatus(message, isError = false) {
  ui.status.textContent = message;
  ui.status.classList.toggle("notice-error", isError);
  ui.status.hidden = false;
}

function isConfigured() {
  return Object.values(firebaseConfig).every((value) => value && !value.startsWith("VLOZ_"));
}

async function connectFirebase() {
  const [appModule, authModule, store] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-auth.js`),
    import(`https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-firestore.js`)
  ]);
  const app = appModule.initializeApp(firebaseConfig);
  auth = authModule.getAuth(app);
  database = store.getFirestore(app);
  return { authModule, store };
}

function updateAccount(user) {
  const signedIn = Boolean(user);
  ui.signIn.hidden = signedIn;
  ui.signIn.disabled = signedIn || !firebaseReady;
  ui.signOut.hidden = !signedIn;
  ui.signedOut.hidden = signedIn;
  ui.accountDetails.hidden = !signedIn;
  ui.friendsSection.hidden = !signedIn;
  ui.composer.hidden = !signedIn;
  if (user) {
    ui.accountName.textContent = user.displayName || "Prihlaseny autor";
    ui.accountUid.textContent = user.uid;
  }
}

async function getVisiblePosts(store) {
  const collection = store.collection(database, "posts");
  const queries = [store.getDocs(store.query(collection, store.where("visibility", "==", "public")))];
  if (currentUser) {
    queries.push(store.getDocs(store.query(collection, store.where("ownerUid", "==", currentUser.uid))));
    queries.push(store.getDocs(store.query(collection, store.where("friendUids", "array-contains", currentUser.uid))));
  }

  const posts = new Map();
  for (const snapshot of await Promise.all(queries)) {
    for (const document of snapshot.docs) {
      const post = { id: document.id, ...document.data() };
      if (post.visibility === "public" || post.ownerUid === currentUser?.uid ||
        (post.visibility === "friends" && post.friendUids?.includes(currentUser?.uid))) {
        posts.set(document.id, post);
      }
    }
  }
  return [...posts.values()].sort((first, second) =>
    (second.createdAt?.toMillis?.() || 0) - (first.createdAt?.toMillis?.() || 0)
  );
}

function makePostCard(post, store) {
  const article = document.createElement("article");
  article.className = "post-card";
  const metadata = document.createElement("div");
  metadata.className = "post-meta";
  const date = document.createElement("time");
  date.textContent = post.createdAt?.toDate
    ? new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "long", year: "numeric" }).format(post.createdAt.toDate())
    : "Prave ted";
  const tag = document.createElement("span");
  tag.className = `visibility-tag ${post.visibility || "public"}`;
  tag.textContent = post.visibility === "friends" ? "Kamaradi" : post.visibility === "private" ? "Soukrome" : "Verejne";
  metadata.append(date, tag);

  const title = document.createElement("h3");
  title.className = "post-title";
  title.textContent = post.title;
  const body = document.createElement("p");
  body.className = "post-body";
  body.textContent = post.body;
  article.append(metadata, title, body);

  if (currentUser?.uid === post.ownerUid) {
    const actions = document.createElement("div");
    actions.className = "post-actions";
    const button = document.createElement("button");
    button.className = "post-delete";
    button.type = "button";
    button.textContent = "Smazat zapis";
    button.addEventListener("click", async () => {
      if (!window.confirm("Opravdu chces tenhle zapis smazat?")) return;
      try {
        await store.deleteDoc(store.doc(database, "posts", post.id));
        await loadPosts(store);
      } catch (error) {
        showStatus(`Zapis se nepodarilo smazat: ${error.message}`, true);
      }
    });
    actions.append(button);
    article.append(actions);
  }
  return article;
}

async function loadPosts(store) {
  ui.posts.replaceChildren();
  const loading = document.createElement("p");
  loading.className = "empty-state";
  loading.textContent = "Nacitam zapisky...";
  ui.posts.append(loading);
  try {
    const posts = await getVisiblePosts(store);
    ui.posts.replaceChildren();
    ui.postCount.textContent = `${posts.length} ${posts.length === 1 ? "zapisek" : "zapisku"}`;
    if (!posts.length) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "Zatim tu nic neni. Brzy pribude prvni zapis.";
      ui.posts.append(empty);
      return;
    }
    for (const post of posts) ui.posts.append(makePostCard(post, store));
  } catch (error) {
    ui.posts.replaceChildren();
    const failed = document.createElement("p");
    failed.className = "empty-state";
    failed.textContent = "Zapisky se nepodarilo nacist. Zkontroluj Firebase a pravidla Firestore.";
    ui.posts.append(failed);
    showStatus(`Nacteni prispevku se nezdarilo: ${error.message}`, true);
  }
}

async function loadFriends(store) {
  const snapshot = await store.getDocs(store.collection(database, "users", currentUser.uid, "friends"));
  friendIds = snapshot.docs.map((friend) => friend.id);
  ui.friends.replaceChildren();
  for (const friendId of friendIds) {
    const item = document.createElement("li");
    const label = document.createElement("span");
    label.textContent = friendId;
    const remove = document.createElement("button");
    remove.className = "friend-remove";
    remove.type = "button";
    remove.textContent = "Odebrat";
    remove.addEventListener("click", () => removeFriend(friendId, store));
    item.append(label, remove);
    ui.friends.append(item);
  }
}

async function removeFriend(friendId, store) {
  try {
    const snapshot = await store.getDocs(store.query(
      store.collection(database, "posts"),
      store.where("ownerUid", "==", currentUser.uid),
      store.where("visibility", "==", "friends")
    ));
    const affected = snapshot.docs.filter((post) => (post.data().friendUids || []).includes(friendId));
    for (let start = 0; start < affected.length; start += 450) {
      const batch = store.writeBatch(database);
      for (const post of affected.slice(start, start + 450)) {
        batch.update(post.ref, { friendUids: store.arrayRemove(friendId) });
      }
      await batch.commit();
    }
    await store.deleteDoc(store.doc(database, "users", currentUser.uid, "friends", friendId));
    await loadFriends(store);
    await loadPosts(store);
    showStatus("Kamarad byl odebran a uz neuvidi tvoje nove ani drivejsi zapisky pro kamarady.");
  } catch (error) {
    showStatus(`Kamarada se nepodarilo odebrat: ${error.message}`, true);
  }
}

async function start() {
  if (!isConfigured()) {
    showStatus("Nejdriv dopln Firebase konfiguraci podle README. Verejne zapisky se pak zacnou nacitat.");
    return;
  }
  try {
    const { authModule, store } = await connectFirebase();
    firebaseReady = true;
    ui.setupNotice.hidden = true;
    ui.signIn.disabled = false;
    ui.signIn.addEventListener("click", async () => {
      try {
        await authModule.signInWithPopup(auth, new authModule.GoogleAuthProvider());
      } catch (error) {
        showStatus(`Prihlaseni se nezdarilo: ${error.message}`, true);
      }
    });
    ui.signOut.addEventListener("click", () => authModule.signOut(auth));
    ui.copyUid.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(currentUser.uid);
        showStatus("ID je zkopirovane. Posli ho jen kamaradovi, kteremu duverujes.");
      } catch {
        showStatus("ID zkopiruj rucne oznacenim textu vedle tlacitka.", true);
      }
    });

    ui.friendForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const friendId = ui.friendInput.value.trim();
      if (!friendId || friendId === currentUser.uid) {
        showStatus("Zadej ID kamarada. Svoje vlastni ID pridat nejde.", true);
        return;
      }
      try {
        await store.setDoc(store.doc(database, "users", currentUser.uid, "friends", friendId), {
          addedAt: store.serverTimestamp()
        });
        ui.friendInput.value = "";
        await loadFriends(store);
        showStatus("Kamarad byl pridan. Pri dalsim zapisku mu muzes povolit pristup.");
      } catch (error) {
        showStatus(`Kamarada se nepodarilo pridat: ${error.message}`, true);
      }
    });

    ui.postForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = new FormData(ui.postForm);
      const visibility = data.get("visibility");
      const post = {
        title: data.get("title").trim(),
        body: data.get("body").trim(),
        visibility,
        ownerUid: currentUser.uid,
        friendUids: visibility === "friends" ? [...friendIds] : [],
        createdAt: store.serverTimestamp()
      };
      if (visibility === "friends" && !post.friendUids.length) {
        showStatus("Nejdriv pridej kamarada, ktery smi tenhle zapis cist.", true);
        return;
      }
      try {
        await store.addDoc(store.collection(database, "posts"), post);
        ui.postForm.reset();
        await loadPosts(store);
        showStatus("Zapis je ulozeny.");
      } catch (error) {
        showStatus(`Zapis se nepodarilo ulozit: ${error.message}`, true);
      }
    });

    authModule.onAuthStateChanged(auth, async (user) => {
      currentUser = user;
      updateAccount(user);
      if (user) {
        try {
          await loadFriends(store);
        } catch (error) {
          showStatus(`Seznam kamaradu se nepodarilo nacist: ${error.message}`, true);
        }
      } else {
        friendIds = [];
        ui.friends.replaceChildren();
      }
      await loadPosts(store);
    });
  } catch (error) {
    showStatus(`Firebase se nepodarilo spustit: ${error.message}`, true);
  }
}

updateAccount(null);
start();