const render = (options) => {
    let game = new Game()
    game.init()
    let current_score = document.getElementsByClassName('current-score')[0]
    let mask = document.getElementsByClassName('mask')[0]
    let score = mask.getElementsByClassName('score')[0]
    let restart = mask.getElementsByClassName('restart')[0]
    game._addSuccessFn(function (socre) {
        current_score.innerHTML = score
    })
    game._addFailedFn(function () {
        mask.style.display = "flex"
        score.innerText = game.score
    })
    restart.addEventListener('click', function () {
        mask.style.display = "none"
        game._restart()
    })
  
    return Promise.resolve();
  };
  
  (global => {
    global['prehtml'] = {
      bootstrap: () => {
        console.log('purehtml bootstrap');
        return Promise.resolve();
      },
      mount: (options) => {
        console.log('purehtml mount', options);
        return render(options);
      },
      unmount: () => {
        console.log('purehtml unmount');
        return Promise.resolve();
      },
    };
  })(window);