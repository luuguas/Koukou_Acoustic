//定数
const fadeOut = 1000;
const playingWidth = 10;

//グローバル変数
let bgmPlayingPlayer;
let seDraggingPlayer;

function toggleClass(elem, before, after) {
    $(elem).removeClass(before);
    $(elem).addClass(after);
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

function changeSeekBarByAudio(player, fadeOut) {
    let audio = $(player).children('audio');
    let timeCurrent = $(player).find('.time-current');
    let seekBar = $(player).find('.seekbar');
    let seekBarPlayed = $(seekBar).children('.seekbar-played');
    if (!$(seekBar).hasClass('dragging')) {
        //時間表示を変更
        $(timeCurrent).text(displayTime($(audio).prop('currentTime')));
        //シークバーを変更
        $(seekBarPlayed).width(parseInt(($(seekBar).width() - playingWidth) * $(audio).prop('currentTime') / $(audio).prop('duration') + 0.001)); //+0.001は誤差吸収
        //audioが再生を終了する直前ならフェードアウト
        if (1000 * ($(audio).prop('duration') - $(audio).prop('currentTime')) < fadeOut && !$(audio).prop('paused')) {
            if ($(player).children('button').hasClass('playing'))
                $(player).children('button').click();
        }
    }
}

function changeAudioBySeekBar(player) {
    let audio = $(player).children('audio');
    let seekBar = $(player).find('.seekbar');
    let played = $(seekBar).children('.seekbar-played');
    //シークバーの位置からaudioの再生時間を変更
    if ($(played).width() === 0)
        $(audio).prop('currentTime', 0.0);
    else if ($(played).width() === $(seekBar).width() - playingWidth)
        $(audio).prop('currentTime', $(audio).prop('duration'));
    else
        $(audio).prop('currentTime', $(played).width() / ($(seekBar).width() - playingWidth) * $(audio).prop('duration'));
}

function changeSeekBarByCursor(e, player) {
    let timeCurrent = $(player).find('.time-current');
    let seekBar = $(player).find('.seekbar');
    let played = $(seekBar).children('.seekbar-played');
    let duration = $(player).children('audio').prop('duration');
    let seekBarOffset = $(seekBar).offset();
    //シークバー及び表示中の再生時間を変更
    if (e.pageX < seekBarOffset.left + playingWidth / 2) {
        $(played).width(0);
        $(timeCurrent).text(displayTime(0.0));
    }
    else if (seekBarOffset.left + $(seekBar).width() - playingWidth / 2 < e.pageX) {
        $(played).width($(seekBar).width() - playingWidth);
        $(timeCurrent).text(displayTime(duration));
    }
    else {
        $(played).width(parseInt(e.pageX - seekBarOffset.left - playingWidth / 2));
        $(timeCurrent).text(displayTime($(played).width() / ($(seekBar).width() - playingWidth) * duration));
    }
}

$(document).ready(function () {
    console.log('JavaScript file (script.js) is running.');

    //playerを追加
    new Vue({
        el: '#bgm',
        data: {
            fileNames: [
                'BGM平安2.mp3',
                'BGM平安貴族.mp3',
                'BGM日常現代.mp3',
            ]
        },
        methods: {
            src: function (fileName) {
                return 'music/BGM/' + fileName;
            }
        }
    });
    new Vue({
        el: '#se',
        data: {
            fileNames: [
                'スマホのタップ音.mp3',
                'アラーム.mp3',
                '突然の起床.mp3',
                'ドア現代.mp3',
                'アスファルトを走る(20歩).mp3',
                '自動車事故.mp3',
                '車の走行音.mp3',
                'タイムスリップ.mp3',
                '喧嘩.mp3',
                '笛.mp3',
                '開門.mp3',
                'きらきら輝く2.mp3',
                '馬が走る1.mp3',
                '車・急ブレーキ02.mp3',
            ]
        },
        methods: {
            src: function (fileName) {
                return 'music/SE/' + fileName;
            }
        }
    });

    bgmPlayingPlayer = null;
    seDraggingPlayer = null;

    //bgm内の各playerに機能を追加
    $('#bgm .player').each(function () {

        /* 再生・一時停止ボタンの機能 */
        let button = $(this).children('button');
        $(button).addClass('pausing');
        let args = { player: this };
        $(button).click(args, function (e) {
            let player = e.data.player;
            if ($(this).hasClass('playing')) { //同一player内のaudioが再生中
                toggleClass(this, 'playing', 'fading');
                $('#bgm button').attr('disabled', true);

                //audioの音量をフェードアウト
                let fadeVolume = setInterval(function (button, audio, startTime, duration) {
                    let now = Date.now();
                    if (now - startTime > duration) {
                        clearInterval(fadeVolume);
                        //再生中のaudioを停止
                        $(audio)[0].pause();
                        $(audio)[0].volume = 1.0;
                        toggleClass(button, 'fading', 'pausing');
                        bgmPlayingPlayer = null;
                        //buttonを選択可にする
                        $('#bgm button').attr('disabled', false);
                    }
                    else {
                        $(audio)[0].volume = (startTime + duration - now) / duration;
                    }
                }, 50,
                    this, $(player).children(audio), Date.now(), fadeOut);
            }
            else if (bgmPlayingPlayer !== null) { //他のplayer内のaudioが再生中
                //buttonを選択不可にする
                toggleClass($(bgmPlayingPlayer).children('button'), 'playing', 'fading');
                $('#bgm button').attr('disabled', true);


                //audioの音量をフェードアウト
                let fadeVolume = setInterval(function (playingPlayer, myPlayer, startTime, duration) {
                    let now = Date.now();
                    let playingButton = $(playingPlayer).children('button');
                    let playingAudio = $(playingPlayer).children('audio');
                    if (now - startTime > duration) {
                        clearInterval(fadeVolume);
                        //再生中のaudioを停止
                        $(playingAudio)[0].pause();
                        $(playingAudio)[0].volume = 1.0;
                        toggleClass(playingButton, 'fading', 'pausing');
                        //自分のaudioを再生
                        $(myPlayer).children('audio')[0].play();
                        toggleClass($(myPlayer).children('button'), 'pausing', 'playing');
                        bgmPlayingPlayer = myPlayer;
                        //buttonを選択可にする
                        $('#bgm button').attr('disabled', false);
                    }
                    else {
                        $(playingAudio)[0].volume = (startTime + duration - now) / duration;
                    }
                }, 50,
                    bgmPlayingPlayer, player, Date.now(), fadeOut);
            }
            else { //どのaudioも再生していない
                $(player).children('audio')[0].play();
                toggleClass(this, 'pausing', 'playing');
                bgmPlayingPlayer = player;
            }
        });

        /* 再生が終了した時のbuttonの動作 */
        args = { button: $(this).children('button') };
        $(this).children('audio').on('ended', args, function (e) {
            if ($(e.data.button).hasClass('playing')) {
                toggleClass(e.data.button, 'playing', 'pausing');
                bgmPlayingPlayer = null;
            }
        });

        /* 再生中のplayerのシークバーの動作 */
        args = { player: this };
        $(this).children('audio').on('timeupdate', args, function (e) {
            changeSeekBarByAudio(e.data.player, fadeOut);
        });

        /* シークバーの動作 */
        let seekBar = $(this).find('.seekbar');
        //シークバーを押したときの動作
        args = { player: this };
        $(seekBar).mousedown(args, function (e) {
            $(this).addClass('dragging');
            seDraggingPlayer = e.data.player;
            changeSeekBarByCursor(e, e.data.player)
        });
        //ドラッグした時の動作
        $(document).mousemove(function (e) {
            if (seDraggingPlayer !== null) {
                changeSeekBarByCursor(e, seDraggingPlayer);
            }
        });
        //ドラッグが終わった時の動作
        $(document).mouseup(function () {
            if (seDraggingPlayer !== null) {
                changeAudioBySeekBar(seDraggingPlayer);
                $(seDraggingPlayer).find('.seekbar').removeClass('dragging');
                seDraggingPlayer = null;
            }
        });

        /* 動画の長さを表示 */
        let loadDuration = setInterval(function (player) {
            let audio = $(player).children('audio');
            if (!isNaN($(audio).prop('duration'))) {
                clearInterval(loadDuration);
                $(player).find('.time-duration').text(displayTime($(audio).prop('duration')));
            }
        }, 10,
            this);
    });

    return;

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

        // 再生ボタンの機能 
        button.addEventListener('click', {
            cancel: player.getElementsByClassName('cancel')[0],
            button: button,
            audios: audiosClass.getElementsByTagName('audio'),
            handleEvent: function () {
                //フラグ切り替え
                toggleClass(this.button, 'pausing', 'playing');
                for (var j = 0; j < this.audios.length; ++j) {
                    if (this.audios[j].paused) {
                        //audioを再生
                        this.audios[j].currentTime = 0;
                        this.audios[j].play();

                        //cancelボタンを追加
                        var cancelButton = document.createElement('button');
                        cancelButton.classList.add('cancel-' + j);
                        cancelButton.addEventListener('click', {
                            audio: this.audios[j],
                            handleEvent: function () {
                                //endedイベントを発火
                                this.audio.currentTime = this.audio.duration;
                            }
                        })
                        this.cancel.appendChild(cancelButton);

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
        // audioの再生が終了したときの処理 
        for (var j = 0; j < audios.length; ++j) {
            var audio = audios[j];
            audio.setAttribute('index', 'cancel-' + j);
            audio.addEventListener('ended', {
                player: player,
                button: button,
                audio: audio,
                handleEvent: function () {
                    //cancelボタンを削除
                    var cancel = this.player.getElementsByClassName('cancel')[0];
                    var cancelButton = this.player.getElementsByClassName(this.audio.getAttribute('index'))[0];
                    cancel.removeChild(cancelButton);

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

        // ファイル名を表示 
        var title = player.getElementsByClassName('title')[0];
        var reg = /[^\/]+$/;
        title.textContent = firstAudio.getAttribute('src').match(reg);
    }
});