// script.js
import { auth, db, collection, query, where, getDocs, doc, setDoc, updateDoc, arrayUnion, arrayRemove, getDoc } from "./firebase-config.js";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js"; // ここをFirebase Consoleのバージョンに合わせる

// DOM要素の取得
const homePage = document.getElementById('home-page');
const authPage = document.getElementById('auth-page');
const learnPage = document.getElementById('learn-page');
const reviewPage = document.getElementById('review-page');

const navHome = document.getElementById('nav-home');
const navLearn = document.getElementById('nav-learn');
const navReview = document.getElementById('nav-review');

const authSection = document.getElementById('auth-section');
const userStatus = document.getElementById('user-status');
const loginButton = document.getElementById('login-button');
const logoutButton = document.getElementById('logout-button');

const emailInput = document.getElementById('email-input');
const passwordInput = document.getElementById('password-input');
const signupButton = document.getElementById('signup-button');
const signinButton = document.getElementById('signin-button');
const authError = document.getElementById('auth-error');

const wordListDiv = document.getElementById('word-list');
const prevPageButton = document.getElementById('prev-page');
const nextPageButton = document.getElementById('next-page');

const masteredWordsCountSpan = document.getElementById('mastered-words-count');

const startReviewButton = document.getElementById('start-review-button');
const reviewWordsArea = document.getElementById('review-words-area');
const reviewInputArea = document.getElementById('review-input-area');
const reviewAnswerInput = document.getElementById('review-answer-input');
const submitAnswerButton = document.getElementById('submit-answer');
const reviewResultsDiv = document.getElementById('review-results');
const correctCountSpan = document.getElementById('correct-count');
const totalQuestionsSpan = document.getElementById('total-questions');
const incorrectWordsListDiv = document.getElementById('incorrect-words-list');
const retakeIncorrectButton = document.getElementById('retake-incorrect-button');
const backToReviewMainButton = document.getElementById('back-to-review-main');

// グローバル変数
const WORDS_PER_PAGE = 10;
let allWords = []; // 全単語データ
let currentLearnPage = 0;
let currentUser = null; // 現在のユーザー
let masteredWords = []; // ユーザーが覚えた単語のリスト（単語自体）
let currentReviewWords = []; // 現在の復習用単語
let currentReviewIndex = 0;
let incorrectWordsDuringReview = [];

// --- ページ表示切り替え関数 ---
function showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

// --- Firebase認証関連 ---
onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (user) {
        userStatus.textContent = `ログイン中: ${user.email}`;
        loginButton.style.display = 'none';
        logoutButton.style.display = 'inline-block';
        showPage('home-page'); // ログインしたらホームへ

        // ユーザーの覚えた単語リストをFirestoreから取得
        await fetchMasteredWords(user.uid);
        await loadWords(); // 単語データの読み込み
        updateMasteredWordsCount();

    } else {
        userStatus.textContent = 'ログアウト中';
        loginButton.style.display = 'inline-block';
        logoutButton.style.display = 'none';
        masteredWords = []; // ログアウト時はリセット
        masteredWordsCountSpan.textContent = '0';
        showPage('auth-page'); // ログアウト時は認証ページへ
    }
});

signupButton.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // 新規ユーザーデータをFirestoreに作成
        await setDoc(doc(db, "users", userCredential.user.uid), {
            email: userCredential.user.email,
            masteredWords: []
        });
        authError.textContent = '';
    } catch (error) {
        authError.textContent = `新規登録エラー: ${error.message}`;
    }
});

signinButton.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
        authError.textContent = '';
    } catch (error) {
        authError.textContent = `ログインエラー: ${error.message}`;
    }
});

logoutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
        authError.textContent = '';
    } catch (error) {
        authError.textContent = `ログアウトエラー: ${error.message}`;
    }
});

// --- 単語データ管理 (Firestore) ---

// Firestoreから単語データを取得
async function fetchWordsFromFirestore() {
    const wordsCol = collection(db, "words");
    const snapshot = await getDocs(wordsCol);
    return snapshot.docs.map(doc => doc.data());
}

// ユーザーが覚えた単語を取得
async function fetchMasteredWords(uid) {
    const userDocRef = doc(db, "users", uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
        masteredWords = userDocSnap.data().masteredWords || [];
    } else {
        masteredWords = [];
    }
}

// ユーザーの覚えた単語を更新 (Firestore)
async function updateMasteredWords(uid) {
    if (!uid) return;
    const userDocRef = doc(db, "users", uid);
    await updateDoc(userDocRef, {
        masteredWords: masteredWords
    });
    updateMasteredWordsCount();
}

// 覚えた単語数を表示更新
function updateMasteredWordsCount() {
    masteredWordsCountSpan.textContent = masteredWords.length;
}

// 初期単語データをFirestoreに一括追加 (開発・初回用)
// この関数は一度実行したらコメントアウトするか削除してください
async function addInitialWordsToFirestore() {
    const initialWords = [
        { word: "apple", meaning: "りんご", level: "elementary" },
        { word: "book", meaning: "本", level: "elementary" },
        { word: "cat", meaning: "猫", level: "elementary" },
        { word: "dog", meaning: "犬", level: "elementary" },
        { word: "elephant", meaning: "象", level: "象" },
        { word: "flower", meaning: "花", level: "elementary" },
        { word: "grape", meaning: "ぶどう", level: "elementary" },
        { word: "house", meaning: "家", level: "elementary" },
        { word: "ice", meaning: "氷", level: "elementary" },
        { word: "juice", meaning: "ジュース", level: "elementary" },
        { word: "kitchen", meaning: "台所", level: "elementary" },
        { word: "lemon", meaning: "レモン", level: "elementary" },
        { word: "money", meaning: "お金", level: "middle" },
        { word: "nation", meaning: "国家", level: "middle" },
        { word: "ocean", meaning: "大洋", level: "middle" },
        { word: "peace", meaning: "平和", level: "middle" },
        { word: "quality", meaning: "質", level: "middle" },
        { word: "require", meaning: "必要とする", level: "middle" },
        { word: "society", meaning: "社会", level: "middle" },
        { word: "technology", meaning: "技術", level: "middle" },
        { word: "understand", meaning: "理解する", level: "middle" },
        { word: "various", meaning: "様々な", level: "middle" },
        { word: "wonder", meaning: "不思議に思う", level: "middle" },
        { word: "xylophone", meaning: "木琴", level: "middle" },
        { word: "youth", meaning: "若者", level: "middle" },
        { word: "zero", meaning: "ゼロ", level: "middle" }
    ];

    for (const wordData of initialWords) {
        // ドキュメントIDを単語自体にする（ユニーク性を保つため）
        await setDoc(doc(db, "words", wordData.word.toLowerCase()), wordData);
        console.log(`Added: ${wordData.word}`);
    }
    console.log("Initial words added to Firestore.");
}
// 初回のみ実行したい場合は、以下のコメントを外して実行後、再度コメントアウト
// addInitialWordsToFirestore(); // ここからコメントを外す


// 全単語データを読み込む（Firestoreから）
async function loadWords() {
    try {
        allWords = await fetchWordsFromFirestore();
        console.log("Words loaded:", allWords);
        displayWords(currentLearnPage);
    } catch (error) {
        console.error("Error loading words:", error);
        alert("単語の読み込みに失敗しました。");
    }
}

// --- 単語学習ページ ---
function displayWords(pageNumber) {
    wordListDiv.innerHTML = ''; // リストをクリア
    const startIndex = pageNumber * WORDS_PER_PAGE;
    const endIndex = startIndex + WORDS_PER_PAGE;
    const wordsToDisplay = allWords.slice(startIndex, endIndex);

    wordsToDisplay.forEach(wordData => {
        const wordItem = document.createElement('div');
        wordItem.classList.add('word-item', 'hidden'); // 初期は隠す
        wordItem.dataset.word = wordData.word; // データ属性に単語を保存

        const wordElement = document.createElement('strong');
        wordElement.textContent = wordData.word;

        const meaningElement = document.createElement('span');
        meaningElement.classList.add('word-meaning');
        meaningElement.textContent = wordData.meaning;

        const revealButton = document.createElement('button');
        revealButton.textContent = '意味を見る';
        revealButton.classList.add('reveal-button');
        revealButton.addEventListener('click', () => {
            wordItem.classList.remove('hidden');
            wordItem.classList.add('revealed');
        });

        const masteredButton = document.createElement('button');
        const isMastered = masteredWords.includes(wordData.word);
        masteredButton.textContent = isMastered ? '覚えた！(解除)' : '覚えた！';
        masteredButton.classList.add('mastered-button');
        if (isMastered) {
            masteredButton.style.backgroundColor = '#ffc107'; // 覚えたら色を変える
        }

        masteredButton.addEventListener('click', async () => {
            if (!currentUser) {
                alert('ログインして覚えた単語を記録しましょう！');
                return;
            }
            const word = wordData.word;
            if (masteredWords.includes(word)) {
                // 覚えたリストから削除
                masteredWords = masteredWords.filter(w => w !== word);
                masteredButton.textContent = '覚えた！';
                masteredButton.style.backgroundColor = '#007bff';
                alert(`「${word}」を覚えた単語から削除しました。`);
            } else {
                // 覚えたリストに追加
                masteredWords.push(word);
                masteredButton.textContent = '覚えた！(解除)';
                masteredButton.style.backgroundColor = '#ffc107';
                alert(`「${word}」を覚えた単語に追加しました！`);
            }
            await updateMasteredWords(currentUser.uid); // Firestoreを更新
        });

        wordItem.appendChild(wordElement);
        wordItem.appendChild(meaningElement);
        wordItem.appendChild(revealButton);
        wordItem.appendChild(masteredButton);
        wordListDiv.appendChild(wordItem);
    });

    // ページ送りボタンの表示/非表示
    prevPageButton.style.display = pageNumber > 0 ? 'inline-block' : 'none';
    nextPageButton.style.display = (pageNumber + 1) * WORDS_PER_PAGE < allWords.length ? 'inline-block' : 'none';
}

nextPageButton.addEventListener('click', () => {
    currentLearnPage++;
    displayWords(currentLearnPage);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // ページトップへ
});

prevPageButton.addEventListener('click', () => {
    currentLearnPage--;
    displayWords(currentLearnPage);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // ページトップへ
});

// --- 単語復習ページ ---

// 復習開始ボタン
startReviewButton.addEventListener('click', () => {
    if (!currentUser || masteredWords.length === 0) {
        alert('ログインして単語を覚えるか、覚えた単語がありません。まずは単語学習ページで単語を覚えましょう！');
        return;
    }
    incorrectWordsDuringReview = []; // リセット
    currentReviewIndex = 0;
    // 覚えた単語からランダムに10単語（またはそれ以下）を選択
    currentReviewWords = shuffleArray(masteredWords).slice(0, WORDS_PER_PAGE);
    if (currentReviewWords.length === 0) {
        alert('復習できる単語がありません。');
        return;
    }
    showReviewQuestion();
    startReviewButton.style.display = 'none';
    reviewInputArea.style.display = 'flex';
    reviewResultsDiv.style.display = 'none';
});

function showReviewQuestion() {
    if (currentReviewIndex < currentReviewWords.length) {
        const wordToReview = currentReviewWords[currentReviewIndex];
        const fullWordData = allWords.find(w => w.word === wordToReview); // 全単語データから詳細を取得

        if (fullWordData) {
            reviewWordsArea.innerHTML = `
                <div class="word-item">
                    <strong>${fullWordData.word}</strong>
                    <span class="word-meaning" style="display:none;">${fullWordData.meaning}</span>
                </div>
            `;
            reviewAnswerInput.value = '';
            reviewAnswerInput.focus();
        } else {
            // 単語データが見つからない場合（エラーハンドリング）
            reviewWordsArea.innerHTML = `<p>単語「${wordToReview}」の詳細が見つかりませんでした。</p>`;
            currentReviewIndex++;
            showReviewQuestion(); // 次の単語へ
        }

    } else {
        // 全ての単語が終了
        showReviewResults();
    }
}

submitAnswerButton.addEventListener('click', () => {
    const userAnswer = reviewAnswerInput.value.trim();
    const wordToReview = currentReviewWords[currentReviewIndex];
    const fullWordData = allWords.find(w => w.word === wordToReview);

    if (fullWordData) {
        const correctMeaning = fullWordData.meaning.trim();
        const currentWordItem = reviewWordsArea.querySelector('.word-item');
        const meaningElement = currentWordItem.querySelector('.word-meaning');

        // 意味を表示
        meaningElement.style.display = 'inline';

        if (userAnswer === correctMeaning) {
            currentWordItem.style.backgroundColor = '#d4edda'; // 正解
        } else {
            currentWordItem.style.backgroundColor = '#f8d7da'; // 不正解
            incorrectWordsDuringReview.push(fullWordData);
            // 間違えたら覚えた単語から引く（重複除去）
            masteredWords = masteredWords.filter(w => w !== fullWordData.word);
            updateMasteredWords(currentUser.uid); // Firestoreを更新
        }
        // 少し待ってから次の単語へ
        setTimeout(() => {
            currentReviewIndex++;
            showReviewQuestion();
        }, 1000); // 1秒表示
    }
});

function showReviewResults() {
    reviewWordsArea.innerHTML = ''; // 復習エリアをクリア
    reviewInputArea.style.display = 'none';
    reviewResultsDiv.style.display = 'block';

    const correctCount = currentReviewWords.length - incorrectWordsDuringReview.length;
    correctCountSpan.textContent = correctCount;
    totalQuestionsSpan.textContent = currentReviewWords.length;

    incorrectWordsListDiv.innerHTML = '';
    if (incorrectWordsDuringReview.length > 0) {
        incorrectWordsDuringReview.forEach(wordData => {
            const item = document.createElement('div');
            item.classList.add('incorrect-word-item');
            item.innerHTML = `<strong>${wordData.word}</strong> - ${wordData.meaning}`;
            incorrectWordsListDiv.appendChild(item);
        });
        retakeIncorrectButton.style.display = 'inline-block';
    } else {
        incorrectWordsListDiv.innerHTML = '<p>素晴らしい！全て正解です！</p>';
        retakeIncorrectButton.style.display = 'none';
    }
    backToReviewMainButton.style.display = 'inline-block';
}

retakeIncorrectButton.addEventListener('click', () => {
    if (incorrectWordsDuringReview.length === 0) {
        alert('再テストする単語がありません。');
        return;
    }
    currentReviewWords = shuffleArray(incorrectWordsDuringReview.map(w => w.word)); // 間違えた単語のみで再テスト
    incorrectWordsDuringReview = []; // 再テスト前にリセット
    currentReviewIndex = 0;
    reviewResultsDiv.style.display = 'none';
    startReviewButton.style.display = 'none'; // 再テストなので開始ボタンは隠す
    showReviewQuestion();
    reviewInputArea.style.display = 'flex'; // 回答入力エリアを表示
});

backToReviewMainButton.addEventListener('click', () => {
    reviewResultsDiv.style.display = 'none';
    startReviewButton.style.display = 'inline-block';
    reviewWordsArea.innerHTML = '';
    reviewAnswerInput.value = '';
    incorrectWordsDuringReview = [];
    currentReviewWords = [];
    currentReviewIndex = 0;
});

// --- ヘルパー関数 ---
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// --- イベントリスナー ---
navHome.addEventListener('click', () => showPage('home-page'));
navLearn.addEventListener('click', () => {
    if (!currentUser) {
        alert('単語学習にはログインが必要です。');
        showPage('auth-page');
        return;
    }
    currentLearnPage = 0; // 学習ページに戻ったら最初から
    displayWords(currentLearnPage);
    showPage('learn-page');
});
navReview.addEventListener('click', () => {
    if (!currentUser) {
        alert('単語復習にはログインが必要です。');
        showPage('auth-page');
        return;
    }
    showPage('review-page');
    startReviewButton.style.display = 'inline-block';
    reviewInputArea.style.display = 'none';
    reviewResultsDiv.style.display = 'none';
    reviewWordsArea.innerHTML = ''; // 復習エリアをクリア
});

// 初期表示
// Firebase認証状態によって初期ページが切り替わるため、ここでは特に設定しない
// onAuthStateChanged が初回のページ表示を制御します