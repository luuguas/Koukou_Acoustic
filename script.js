//定数
const fadeOut = 1000;
const seekBar_PlayingWidth = 10;

function changeButtonDisabled(buttons, disabled) {
    for (var i = 0; i < buttons.length; ++i) {
        buttons[i].disabled = disabled;
    }
}
function toggleClass(element, before, after) {
    element.classList.remove(before);
    element.classList.add(after);
}

function displayTime(time) {
    var minute = parseInt(time / 60);
    var second = parseInt(time) % 60;
    var ret = '';
    if (minute < 10)
        ret = ret + '0' + minute;
    else
        ret += ret + minute;
    ret += ':'
    if (second < 10)
        ret = ret + '0' + second;
    else
        ret = ret + second;
    return ret;
}

function changeSeekBarByAudio(player, playingWidth, fadeOut) {
    var audio = player.getElementsByTagName('audio')[0];
    var timeCurrent = player.getElementsByClassName('time-current')[0];
    var seekBar = player.getElementsByClassName('seekbar')[0];
    var played = seekBar.getElementsByClassName('seekbar-played')[0];
    if (!seekBar.classList.contains('dragging')) {
        //時間表示を変更
        timeCurrent.textContent = displayTime(audio.currentTime);

        //シークバーを変更
        var seekBarWidth = parseInt(window.getComputedStyle(seekBar).width);
        played.style.width = parseInt((seekBarWidth - playingWidth) * (audio.currentTime / audio.duration) + 0.001) + 'px'; //+0.001は誤差吸収

        //audioが再生を終了する直前ならフェードアウト
        if (1000 * (audio.duration - audio.currentTime) < fadeOut && !audio.paused) {
            player.getElementsByTagName('button')[0].click();
        }
    }
}

function changeAudioBySeekBar(player, playingWidth) {
    var audio = player.getElementsByTagName('audio')[0];
    var seekBar = player.getElementsByClassName('seekbar')[0];
    var played = seekBar.getElementsByClassName('seekbar-played')[0];
    var seekBarWidth = parseInt(window.getComputedStyle(seekBar).width);

    //シークバーの位置からaudioの再生時間を変更
    var playedWidth = parseInt(played.style.width);
    if (playedWidth === 0)
        audio.currentTime = 0.0;
    else if (playedWidth === seekBarWidth - playingWidth)
        audio.currentTime = audio.duration;
    else
        audio.currentTime = parseInt(played.style.width) / (seekBarWidth - playingWidth) * audio.duration;
}

function changeSeekBarByCursor(e, player, playingWidth, duration) {
    var timeCurrent = player.getElementsByClassName('time-current')[0];
    var seekBar = player.getElementsByClassName('seekbar')[0];
    var played = seekBar.getElementsByClassName('seekbar-played')[0];
    var seekBarWidth = parseInt(window.getComputedStyle(seekBar).width);

    //シークバーの絶対座標を取得
    var seekBarLocation = seekBar.getBoundingClientRect();
    //シークバー及び表示中の再生時間を変更
    if (e.clientX < seekBarLocation.left + playingWidth / 2) {
        played.style.width = '0px';
        timeCurrent.textContent = displayTime(0);
    }
    else if (seekBarLocation.right - playingWidth / 2 < e.clientX) {
        played.style.width = (seekBarWidth - playingWidth) + 'px';
        timeCurrent.textContent = displayTime(duration);
    }
    else {
        played.style.width = parseInt(e.clientX - seekBarLocation.left - playingWidth / 2) + 'px';
        timeCurrent.textContent = displayTime(parseInt(played.style.width) / (seekBarWidth - playingWidth) * duration);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    console.log('JavaScript is running.');

    //bgmに再生中のplayerのタグ及びドラッグ中のシークバーのタグを付与
    var bgm = document.getElementById('bgm');
    bgm.setAttribute('playing-audio', 'none');
    bgm.setAttribute('dragging-seekbar', 'none');

    //bgm内の各playerに機能を追加
    var bgmPlayers = bgm.getElementsByClassName('player');
    var bgmButtons = bgm.getElementsByTagName('button');
    for (var i = 0; i < bgmPlayers.length; ++i) {
        var tag = 'bgm-' + i;
        var player = bgmPlayers[i];

        //playerに識別タグを追加
        player.classList.add(tag);

        /* 再生・一時停止ボタンの機能 */
        var button = player.getElementsByTagName('button')[0];
        button.setAttribute('index', tag);
        button.classList.add('pausing');
        button.addEventListener('click', {
            bgm: bgm,
            button: button,
            bgmButtons: bgmButtons,
            player: player,
            handleEvent: function () {
                var audio = this.player.getElementsByTagName('audio')[0];
                if (this.button.classList.contains('playing')) {
                    //同一playerのaudioが再生中
                    changeButtonDisabled(this.bgmButtons, true);
                    toggleClass(this.button, 'playing', 'fading');

                    var fadeVolume = setInterval(function (button, audio, startTime, duration) {
                        var now = Date.now();
                        if (now - startTime > duration) {
                            clearInterval(fadeVolume);

                            //audioを一時停止
                            audio.pause();
                            audio.volume = 1.0;
                            //buttonの状態を変更
                            changeButtonDisabled(bgmButtons, false);
                            toggleClass(button, 'fading', 'pausing');
                            //bgmのタグを変更
                            bgm.setAttribute('playing-audio', 'none');
                        }
                        else {
                            //audioの音量をフェードアウト
                            audio.volume = (startTime + duration - now) / duration;
                        }
                    }, 50,
                        this.button, audio, Date.now(), fadeOut);
                }
                else if (this.bgm.getAttribute('playing-audio') !== 'none') {
                    //他playerのaudioが再生中
                    var playingPlayer = this.bgm.getElementsByClassName(this.bgm.getAttribute('playing-audio'))[0];
                    var playingButton = playingPlayer.getElementsByTagName('button')[0];
                    var playingAudio = playingPlayer.getElementsByTagName('audio')[0];

                    changeButtonDisabled(this.bgmButtons, true);
                    toggleClass(playingButton, 'playing', 'fading');

                    var fadeVolume = setInterval(function (playingButton, playingAudio, button, audio, startTime, duration) {
                        var now = Date.now();
                        if (now - startTime > duration) {
                            clearInterval(fadeVolume);

                            //再生中のaudioを一時停止
                            playingAudio.pause();
                            playingAudio.volume = 1.0;
                            //再生中のbuttonの状態を変更
                            toggleClass(playingButton, 'fading', 'pausing');

                            //audioを再生
                            audio.play();
                            //buttonの状態を変更
                            changeButtonDisabled(bgmButtons, false);
                            toggleClass(button, 'pausing', 'playing');
                            //bgmのタグを変更
                            bgm.setAttribute('playing-audio', button.getAttribute('index'));
                        }
                        else {
                            //audioの音量をフェードアウト
                            playingAudio.volume = (startTime + duration - now) / duration;
                        }
                    }, 50,
                        playingButton, playingAudio, this.button, audio, Date.now(), fadeOut);
                }
                else {
                    //audioを再生
                    audio.play();
                    //buttonの状態を変更
                    toggleClass(this.button, 'pausing', 'playing');
                    //bgmのタグを変更
                    this.bgm.setAttribute('playing-audio', this.button.getAttribute('index'));
                }
            }
        });

        /* 再生中のplayerのシークバーの動作 */
        var audio = player.getElementsByTagName('audio')[0];
        audio.load();
        audio.addEventListener('timeupdate', {
            player: player,
            handleEvent: function () {
                changeSeekBarByAudio(this.player, seekBar_PlayingWidth, fadeOut);
            }
        });

        /* 再生終了時のbuttonの動作 */
        audio.addEventListener('ended', {
            button: button,
            bgm: bgm,
            handleEvent: function () {
                if (this.button.classList.contains('playing')) {
                    toggleClass(this.button, 'playing', 'pausing');
                    this.bgm.setAttribute('playing-audio', 'none');
                }
            }
        })

        /* シークバーを操作した時の動作 */
        var seekBar = player.getElementsByClassName('seekbar')[0];
        seekBar.setAttribute('index', tag);
        //シークバーを押した時
        seekBar.addEventListener('mousedown', {
            bgm: bgm,
            seekBar: seekBar,
            player: player,
            audio: audio,
            handleEvent: function (e) {
                //ドラッグ中のフラグを立てる
                this.seekBar.classList.add('dragging');
                this.bgm.setAttribute('dragging-seekbar', this.seekBar.getAttribute('index'));
                changeSeekBarByCursor(e, this.player, seekBar_PlayingWidth, this.audio.duration);
            }
        });
        //シークバーを押した後にドラッグした時
        document.addEventListener('mousemove', {
            bgm: bgm,
            handleEvent: function (e) {
                var tag = this.bgm.getAttribute('dragging-seekbar');
                if (tag !== 'none') {
                    var draggingPlayer = this.bgm.getElementsByClassName(tag)[0];
                    var audio = draggingPlayer.getElementsByTagName('audio')[0];
                    changeSeekBarByCursor(e, draggingPlayer, seekBar_PlayingWidth, audio.duration);
                }
            }
        });
        //マウスを離した時
        document.addEventListener('mouseup', {
            bgm: bgm,
            handleEvent: function () {
                var tag = this.bgm.getAttribute('dragging-seekbar');
                if (tag !== 'none') {
                    var draggingPlayer = this.bgm.getElementsByClassName(tag)[0];
                    draggingPlayer.getElementsByClassName('seekbar')[0].classList.remove('dragging');
                    this.bgm.setAttribute('dragging-seekbar', 'none');
                    changeAudioBySeekBar(draggingPlayer, seekBar_PlayingWidth)
                }
            }
        })

        /* 時間表示の初期化(動画の長さは後で読み込む) */
        var timeCurrent = player.getElementsByClassName('time-current')[0];
        timeCurrent.textContent = displayTime(0);

        /* ファイル名を表示 */
        var title = player.getElementsByClassName('title')[0];
        var reg = /[^\/]+$/;
        title.textContent = audio.getAttribute('src').match(reg);
    }

    /* 動画の長さを表示 */
    var audios = bgm.getElementsByTagName('audio');
    var timeDurations = bgm.getElementsByClassName('time-duration');
    var loadDuration = setInterval(function (audios, timeDurations) {
        var preloaded = true;
        for (var i = 0; i < audios.length; ++i) {
            if (isNaN(audios[i].duration)) {
                preloaded = false;
                break;
            }
        }
        if (preloaded) {
            clearInterval(loadDuration);
            for (var i = 0; i < audios.length; ++i) {
                timeDurations[i].textContent = displayTime(audios[i].duration);
            }
        }
    }, 100,
        audios, timeDurations);

    var se = document.getElementById('se');
    //seの各playerに機能を追加
    var sePlayers = se.getElementsByClassName('player');
    for (var i = 0; i < sePlayers.length; ++i) {
        var player = sePlayers[i];
        var button = player.getElementsByTagName('button')[0];
        var audiosClass = player.getElementsByClassName('audios')[0];
        var firstAudio = player.getElementsByTagName('audio')[0];

        //audioを複製
        for (var j = 0; j < 4; ++j) {
            var appendAudio = document.createElement('audio');
            appendAudio.src = firstAudio.src;
            appendAudio.preload = 'metadata';
            audiosClass.appendChild(appendAudio);
        }

        //ボタンにフラグを追加
        button.classList.add('pausing');
        button.setAttribute('playing-num', '0');

        /* 再生ボタンの機能 */
        button.addEventListener('click', {
            button: button,
            audios: audiosClass.getElementsByTagName('audio'),
            handleEvent: function () {
                //フラグ切り替え
                toggleClass(this.button, 'pausing', 'playing');
                for (var j = 0; j < this.audios.length; ++j) {
                    if (this.audios[j].paused) {
                        //audioを再生
                        this.audios[j].play();
                        //再生中のaudioの個数を1増やす
                        this.button.setAttribute('playing-num', parseInt(this.button.getAttribute('playing-num')) + 1);
                        //ボタン操作可能の切替
                        if (parseInt(this.button.getAttribute('playing-num')) < 5)
                            this.button.disabled = false;
                        else
                            this.button.disabled = true;
                        return;
                    }
                }
            }
        });

        var audios = audiosClass.getElementsByTagName('audio');
        /* audioの再生が終了したときの処理 */
        for (var j = 0; j < audios.length; ++j) {
            var audio = audios[j];
            audio.addEventListener('ended', {
                button: button,
                audio: audio,
                handleEvent: function () {
                    //再生中のaudioの個数を1減らす
                    this.button.setAttribute('playing-num', parseInt(this.button.getAttribute('playing-num')) - 1);
                    //フラグ切り替え
                    if (parseInt(this.button.getAttribute('playing-num')) === 0)
                        toggleClass(this.button, 'playing', 'pausing');
                    //ボタン操作可能の切替
                    if (parseInt(this.button.getAttribute('playing-num')) < 5)
                        this.button.disabled = false;
                    else
                        this.button.disabled = true;
                }
            });
        }

        /* ファイル名を表示 */
        var title = player.getElementsByClassName('title')[0];
        var reg = /[^\/]+$/;
        title.textContent = firstAudio.getAttribute('src').match(reg);
    }
});