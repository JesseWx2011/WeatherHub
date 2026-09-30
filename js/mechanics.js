const navbar = document.querySelector('nav');

function openMenu() {
    navbar.classList.add('show');
}

function closeMenu() {
    navbar.classList.remove('show');
}

function backgroundChange() {
    const heroCovers = ["./assets/media/hero-cover-1.mp4", "./assets/media/hero-cover-4.mp4"];
    const heroSection = document.querySelector(".hero-section");
    const heroVideo = document.querySelector("#hero-video");

    if (!heroSection || !heroVideo) {
        return;
    }

    let coverIndex = 0;
    let activeSource = "";
    let loadTimeout;
    let stallTimeout;
    const attemptedCovers = new Set();

    function showFallback() {
        clearTimeout(loadTimeout);
        clearTimeout(stallTimeout);
        activeSource = "";
        heroVideo.pause();
        heroVideo.hidden = true;
        heroVideo.removeAttribute("src");
        heroVideo.load();
    }

    function tryNextCover() {
        if (heroVideo.src !== activeSource) {
            return;
        }

        clearTimeout(loadTimeout);
        clearTimeout(stallTimeout);

        const nextIndex = heroCovers.findIndex((_, index) => !attemptedCovers.has(index));
        if (nextIndex === -1) {
            console.warn("Hero videos could not be played; keeping the image fallback.");
            showFallback();
            return;
        }

        loadCover(nextIndex);
    }

    function loadCover(index) {
        coverIndex = index;
        attemptedCovers.add(index);
        activeSource = new URL(heroCovers[index], document.baseURI).href;
        heroVideo.hidden = true;
        heroVideo.pause();
        heroVideo.src = activeSource;
        heroVideo.load();
        loadTimeout = setTimeout(tryNextCover, 300);
    }

    heroVideo.loop = false;
    heroVideo.addEventListener("canplay", () => {
        if (heroVideo.src !== activeSource) {
            return;
        }

        clearTimeout(loadTimeout);
        heroVideo.hidden = false;
        heroVideo.play().catch((error) => {
            console.warn("Hero video playback was blocked.", error);
            showFallback();
        });
    });

    heroVideo.addEventListener("ended", () => {
        attemptedCovers.clear();
        loadCover((coverIndex + 1) % heroCovers.length);
    });
    heroVideo.addEventListener("error", tryNextCover);
    heroVideo.addEventListener("waiting", () => {
        clearTimeout(stallTimeout);
        stallTimeout = setTimeout(() => {
            if (!heroVideo.paused && heroVideo.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
                tryNextCover();
            }
        }, 8000);
    });
    heroVideo.addEventListener("playing", () => clearTimeout(stallTimeout));

    loadCover(coverIndex);
}

backgroundChange();

function rotateArrow() {
    const dropdownArrow = document.getElementById("dropdownArrow");
    const pageNav = document.querySelector(".current-page-nav");

    if (!dropdownArrow || !pageNav) {
        return;
    }

    dropdownArrow.classList.toggle("is-rotated");
    pageNav.classList.toggle("is-collapsed");
    dropdownArrow.setAttribute(
        "aria-expanded",
        String(!pageNav.classList.contains("is-collapsed"))
    );
}

const dropdownArrow = document.getElementById("dropdownArrow");

if (dropdownArrow) {
    dropdownArrow.addEventListener("click", rotateArrow);
}

function checkInternet() {
    const internetElement = document.getElementById("internetContainer");
    const internetContainerLvl = document.getElementById("internetContainerLevel");
    const internetText = document.getElementById("internetText");

    function handleOffline() {
        internetElement.style.animation = "none";
        internetElement.style.animationDelay = "";
        internetElement.style.opacity = "1";
        internetElement.style.display = "block";
        internetContainerLvl.className = "alert alert-warning";
        internetText.textContent = "Your internet is offline! Weather data will not update until you are online.";
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", () => {
        internetText.textContent = "There we go! We are back online!";
        internetContainerLvl.className = `alert alert-success`;
        internetElement.style.animation = "alertFade 1s forwards";
        internetElement.style.animationDelay = "2s";
    });

    if (!window.navigator.onLine) {
        handleOffline();
    }
}
checkInternet();
