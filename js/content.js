window.addEventListener('load', () => {
    const storageKey    = 'myYTWatchedList';
    const impStorageKey = 'myYTImpList'; 
    const toWatchStorageKey = 'myYTToWatchList';
    let watchedVideos = [];      
    let impVideos = [];      
    let toWatchVideos = [];     
    // ————————————————          
    // 1. Load lists from storage
    // ————————————————          
    function getWatchedVideos() {
      chrome.storage.local.get(  
        [storageKey, impStorageKey, toWatchStorageKey],
        ({ [storageKey]: w, [impStorageKey]: i, [toWatchStorageKey]: t }) => {
          watchedVideos = Array.isArray(w) ? w.map(String) : [];
          impVideos = Array.isArray(i) ? i.map(String) : [];
          toWatchVideos = Array.isArray(t) ? t.map(String) : []; 
          updateUI();
        }
      );
    }
  
    // ————————————————
    // 2. Toggle a video in the watched list
    // ————————————————
    function saveWatchedVideo(videoId) {
      chrome.storage.local.get([storageKey], ({ [storageKey]: w }) => {
        watchedVideos = Array.isArray(w) ? w.map(String) : []; 
        const idx = watchedVideos.indexOf(videoId);        
        if (idx >= 0) watchedVideos.splice(idx, 1);       
        else watchedVideos.push(videoId);
  
        chrome.storage.local.set({ [storageKey]: watchedVideos }, getWatchedVideos);
      });
    }
    
    // 4. Toggle a video in the important list
    // ————————————————
    function saveImpVideo(videoId) {
      chrome.storage.local.get([impStorageKey], ({ [impStorageKey]: i }) => {
        impVideos = Array.isArray(i) ? i.map(String) : [];
        const idx = impVideos.indexOf(videoId);
        if (idx >= 0) impVideos.splice(idx, 1);
        else impVideos.push(videoId);
  
        chrome.storage.local.set({ [impStorageKey]: impVideos }, getWatchedVideos); 
      });
    }

    // Function to toggle a video in the "Mark to be Watch" list
    function saveToWatchVideo(videoId) {
      chrome.storage.local.get([toWatchStorageKey], ({ [toWatchStorageKey]: t }) => {
        toWatchVideos = Array.isArray(t) ? t.map(String) : [];
        const idx = toWatchVideos.indexOf(videoId);
        if (idx >= 0) toWatchVideos.splice(idx, 1);
        else toWatchVideos.push(videoId);

        chrome.storage.local.set({ [toWatchStorageKey]: toWatchVideos }, getWatchedVideos);
      });
    }

    // ————————————————
    // 4. Extract the YouTube ID from a URL
    function extractVideoId(url) {
      if (!url) return null;
      let id = url.split('v=')[1] || url.split('/shorts/')[1];
      if (!id) return null;
      const amp = id.indexOf('&');
      if (amp >= 0) id = id.slice(0, amp);
      return id;
    }
  
    // ————————————————
    // 5. Add/update the three buttons atop the video element  
    // ————————————————
    function createOrUpdateWatchedButton(el, videoId) {
      // Try to find a preceding container
      let container = el.previousElementSibling;
      if (!container || !container.classList.contains('myBoxButtonContainer')) {
        container = document.createElement('div');
        container.className = 'myBoxButtonContainer';
  
        const btnW = document.createElement('button');
        btnW.className = 'myBoxButton ytFixPage1';
        btnW.style.cssText = 'border-radius:12px;padding:5px 10px;margin:10px 0';
  
        const btnI = document.createElement('button');
        btnI.className = 'myBoxButton ytFixPage2';
        btnI.style.cssText = 'border-radius:12px;padding:5px 10px;margin:10px 0';
        btnI.id="ImpBtn";

        const btnT = document.createElement('button');
        btnT.className = 'myBoxButton ytFixPage3';
        btnT.style.cssText = 'border-radius:12px;padding:5px 10px;margin:10px 0';
        
        container.appendChild(btnW);
        container.appendChild(btnI);
        container.appendChild(btnT);
        el.parentNode.insertBefore(container, el);
      }
  
      const [btnW, btnI, btnT] = container.querySelectorAll('button');
  
      // Remove existing event listeners by replacing the buttons
      btnW.replaceWith(btnW.cloneNode(true));
      btnI.replaceWith(btnI.cloneNode(true));
      btnT.replaceWith(btnT.cloneNode(true));
  
      // Re-select the buttons after replacing them
      const newBtnW = container.querySelector('.ytFixPage1');
      const newBtnI = container.querySelector('.ytFixPage2');
      const newBtnT = container.querySelector('.ytFixPage3');
  
      // Add updated event listeners
      newBtnW.addEventListener('click', () => saveWatchedVideo(videoId));
      newBtnI.addEventListener('click', () => saveImpVideo(videoId));
      newBtnT.addEventListener('click', () => saveToWatchVideo(videoId));
  
      const isWatched = watchedVideos.includes(videoId);
      const isImp = impVideos.includes(videoId);
      const isToWatch = toWatchVideos.includes(videoId);
  
      // Update button text and styles
      // new updated section
      newBtnW.textContent = isWatched ? 'Watched' : 'Mark as Watched';
      newBtnW.style.backgroundColor = isWatched ? '#237b2c':'';
      newBtnW.style.border = isWatched ? 'none' : '1px solid #19b929';
      newBtnI.textContent = isImp ? 'IMP' : 'Mark as Important';
      newBtnI.style.backgroundColor = isImp ? 'red' : '';
      newBtnI.style.border = isImp ? 'none' : '1px solid rgb(255, 30, 0)';
      newBtnT.textContent = isToWatch ? 'Want to Watch' : 'Mark to be Watch'; 
      newBtnT.style.backgroundColor = isToWatch ? 'goldenrod' : ''; 
      newBtnT.style.border = isToWatch ? 'none' : '1px solid yellow';
      newBtnT.style.color = isToWatch ? 'black' : '';
  
      // Remove any border on the currently playing video
      el.style.border = 'none';
    }
  
    // ————————————————
    // 6. Dim/feed‐border logic for feed items
    // ————————————————
    function updateWatchedStatus(el, videoId) {
      const parent = el.parentElement;
      parent.classList.add('myBoxWatchedParent');
  
      const isWatched = watchedVideos.includes(videoId);
      const isImp     = impVideos.includes(videoId);
      const isToWatch = toWatchVideos.includes(videoId);
      const isPlaying = el.closest('ytd-watch-metadata') !== null;
  
      if (isPlaying) {
        // show a single “Mark as Watched” button
        let btn = parent.querySelector('.myBoxButton');
        if (!btn) {
          btn = document.createElement('button');
          btn.className = 'myBoxButton';
          btn.textContent = 'Mark as Watched';
          btn.style.cssText = 'border-radius:12px;padding:5px 10px;margin:10px 0';
          btn.addEventListener('click', () => saveWatchedVideo(videoId));
          parent.insertBefore(btn, parent.firstChild);
        }
        if (btn.textContent !== (isWatched ? 'Watched' : 'Mark as Watched'))
          btn.textContent = isWatched ? 'Watched' : 'Mark as Watched';
  
        parent.style.border = 'none';
      } else {
        // feed: border only
        if (isToWatch) parent.style.border = '2px solid goldenrod';
        else if (isImp) parent.style.border = '2px solid red';
        else if (isWatched) parent.style.border = '2px solid green';
        else parent.style.border = 'none';
      }
    }
  
    // ————————————————
    // 7. Scan the page, apply buttons/borders
    // ————————————————
    function updateUI() {
      // Currently playing
      document.querySelectorAll('ytd-watch-metadata').forEach(el => {
        const vid = el.getAttribute('video-id');
        if (vid) createOrUpdateWatchedButton(el, vid);
      });
  
  
      // Feed videos
      document.querySelectorAll('div#dismissible').forEach(el => {
        if (el.classList.contains('ytd-shelf-renderer') ||
            el.classList.contains('ytd-rich-shelf-renderer')) return;
        const thumb = el.querySelector('a#thumbnail');
        const vid   = extractVideoId(thumb && thumb.href);
        if (vid) updateWatchedStatus(el, vid);
      });
  
      // ————— Playlist panel (sidebar) —————
  document.querySelectorAll('ytd-playlist-panel-video-renderer > #wc-endpoint')
  .forEach(el => {
    const vid = extractVideoId(el.href);
    if (vid) updateWatchedStatus(el, vid);
  });

// ————— Playlist page main list —————
document.querySelectorAll('ytd-playlist-video-renderer > #content')
  .forEach(contentEl => {
    const thumbLink = contentEl.querySelector('a#thumbnail');
    if (!thumbLink) return;
    const vid = extractVideoId(thumbLink.href);
    if (vid) updateWatchedStatus(contentEl, vid);
  });
  
      // Rich-item Shorts
      document.querySelectorAll('ytd-rich-item-renderer #content')
        .forEach(el => {
          const link = el.querySelector('.reel-item-endpoint');
          const vid  = extractVideoId(link && link.href);
          if (vid) updateWatchedStatus(el, vid);
        });
  
      // Shorts shelf
      document.querySelectorAll(
        'ytd-reel-shelf-renderer ytm-shorts-lockup-view-model'
      ).forEach(el => {
        const link = el.querySelector('.reel-item-endpoint');
        const vid  = extractVideoId(link && link.href);
        if (vid) updateWatchedStatus(el, vid);
      });
    }
  
    // ————————————————
    // Init + periodic refresh
    // ————————————————
    getWatchedVideos();
    setInterval(updateUI, 1500);
  });
