//定数
const fadeOut = 1000;
const playingWidth = 10;

//グローバル変数
let bgmPlayingPlayer;
let seDraggingPlayer;
let args;

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

let TimeController = {
    props: {
        currentTime: {
            type: Number,
            required: true,
            validator: function (val) {
                return val >= 0;
            },
        },
        duration: {
            type: Number,
            required: true,
            validator: function (val) {
                //ロード前の状態は-1
                return val >= 0 || val == -1;
            },
        },
    },
    template: `<div class="controller">
        <div class="time">
            <label class="time-current">00:00</label>
            <label class="time-div">/</label>
            <label class="time-duration">{{ formatTime(duration) }}</label>
        </div>
        <input type="range" min="0" :max="duration" step="0.01" value="0" class="seekbar">
    </div>`,
    methods: {
        formatTime: function (time) {
            if (time == -1)
                return '--:--';
            let minute = Math.floor(time / 60);
            let second = Math.floor(time) % 60;
            if (minute < 10)
                minute = '0' + minute;
            if (second < 10)
                second = '0' + second;
            return `${minute}:${second}`;
        },
    },
};

let MusicPlayer = {
    props: {
        file: {
            type: Object,
            required: true,
        },
    },
    template: `<div class="player">
        <audio :src="file.path" @loadedmetadata="onloadedmetadata" preload="metadata"></audio>
        <button type="button"></button>
        <div class="container">
            <div class="discription">
                <div class="note"></div>
                <label class="title" v-cloak>{{ file.name }}</label>
            </div>
        <TimeController :currentTime="0" :duration="duration"></TimeController>
        </div>
    </div>`,
    components: {
        TimeController: TimeController,
    },
    data: function () {
        return {
            duration: -1,
        };
    },
    methods: {
        onloadedmetadata: function (e) {
            this.duration = $(e.target).prop('duration');
        }
    },
};

$(document).ready(function () {
    console.log('JavaScript file (script.js) is running.');

    //playerを追加
    new Vue({
        el: '#bgm',
        data: {
            fileList: [
                'BGMタイムスリップ1.mp3',
                'BGM平安2.mp3',
                'BGM平安貴族.mp3',
                'Black Magic2.mp3',
                //'BGM日常現代.mp3',
            ]
        },
        components: {
            'music-player': MusicPlayer,
        },
        computed: {
            pathList: function () {
                return $.map(this.fileList, function (val) {
                    return { name: val, path: 'music/BGM/' + val };
                });
            }
        },
    });
    new Vue({
        el: '#se',
        data: {
            fileList: [
                'スマホのタップ音.mp3',
                'アラーム.mp3',
                'ドア現代.mp3',
                '走る.mp3',
                '自動車事故.mp3',
                'スマホ破壊音.mp3',
                '喧嘩.mp3',
                'ショック.mp3',
                '思いつく1.mp3',
                '羽子板3.mp3',
                '笛.mp3',
                '笛2.mp3',
                '開門.mp3',
                'きらきら輝く2.mp3',
                '馬のいななき.mp3',
                '馬が走る1.mp3',
                '馬と衝突1.mp3',
                '車の走行音.mp3',
                'スマホ破壊音.mp3',
            ]
        },
        computed: {
            pathList: function () {
                return $.map(this.fileList, function (val) {
                    return { name: val, path: 'music/SE/' + val };
                });
            }
        },
    });

    //画像のプリロード
    new Vue({
        el: '#preload',
        data: {
            imageList: [
                'Cracker.svg',
                'Cracker_Disabled.svg',
                'Cracker_Playing.svg',
                'Note_BGM.svg',
                'Note_SE.svg',
                'Pause.svg',
                'Pause_Disabled.svg',
                'Play.svg',
                'Play_Disabled.svg',
                'Stop.svg',
            ],
        },
        computed: {
            pathList: function () {
                return $.map(this.imageList, function (val, idx) {
                    return 'image/' + val;
                });
            },
        },
    });

    bgmPlayingPlayer = null;
    seDraggingPlayer = null;

    //bgm内の各playerに機能を追加
    $('#bgm .player').each(function () {

        /* 再生・一時停止ボタンの機能 */
        let button = $(this).children('button');
        $(button).addClass('pausing');
        args = { player: this };
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
                    this, $(player).children('audio'), Date.now(), fadeOut);
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
    });

    //seの各playerに機能を追加
    $('#se .player').each(function () {
        //audioを複製
        $(this).find('audio:first').attr('index', 'cancel-0');
        for (let i = 1; i < 5; ++i) {
            $(this).children('.audios').append($(this).find('audio:first').clone(true));
            $(this).find('audio').eq(i).attr('index', 'cancel-' + i);
        }

        /* 再生が終了した時の処理 */
        args = { player: this };
        $(this).find('audio').on('ended', args, function (e) {
            //cancelボタンを削除
            $(e.data.player).find('.cancel button').remove('.' + $(this).attr('index'));
            //再生中のaudioの個数を1減らす
            let button = $(e.data.player).find('.play button');
            $(button).attr('playing-num', parseInt($(button).attr('playing-num')) - 1);

            //発火ボタンの状態を変更
            if ($(button).attr('playing-num') === '0')
                toggleClass(button, 'playing', 'pausing');
            if (parseInt($(button).attr('playing-num')) < 5)
                $(button).attr('disabled', false);
        });

        /* 発火ボタンの機能 */
        let button = $(this).find('.play button');
        $(button).attr('playing-num', '0');
        $(button).addClass('pausing');
        args = { player: this };
        $(button).click(args, function (e) {
            let audios = $(e.data.player).find('audio');
            for (let i = 0; i < 5; ++i) {
                if ($(audios).eq(i).prop('paused')) {
                    let audio = $(audios).eq(i);
                    //audioを再生
                    $(audio).prop('currentTime', 0.0);
                    audio[0].play();
                    //cancelボタンを追加
                    let cancelButton = $('<button>', { class: 'cancel-' + i });
                    args = { audio: audio };
                    $(cancelButton).click(args, function (e) {
                        //endedイベントを発火
                        $(e.data.audio).prop('currentTime', $(e.data.audio).prop('duration'));
                    });
                    $(e.data.player).find('.cancel').append(cancelButton);

                    //再生中のaudioの個数を1増やす
                    $(this).attr('playing-num', parseInt($(this).attr('playing-num')) + 1);
                    //発火ボタンの状態を変更
                    toggleClass(this, 'pausing', 'playing');
                    if (parseInt($(this).attr('playing-num')) === 5)
                        $(this).attr('disabled', true);

                    return;
                }
            }
        });
    });
});