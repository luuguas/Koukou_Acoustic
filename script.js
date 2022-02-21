/* 定数 */
const fadeOut = 1000;

//グローバル変数
let bgmPlayingPlayer;
let seDraggingPlayer;
let args;

function toggleClass(elem, before, after) {
    $(elem).removeClass(before);
    $(elem).addClass(after);
}

/* コンポーネント */
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
            <label class="time-current">{{ formatTime(displayedCurrentTime) }}</label>
            <label class="time-div">/</label>
            <label class="time-duration">{{ formatTime(duration) }}</label>
        </div>
        <input
            type="range"
            min="0" :max="duration" step="0.001" :value="displayedCurrentTime"
            class="seekbar"
            @mousedown="onMouseDown" @input="onDragging" @mouseup="onMouseUp"
        >
    </div>`,
    data: function () {
        return {
            isDragging: 0, //0:非ドラッグ / 1:mouseup直後,currentTime変更前 / 2:ドラッグ中
            rangeValue: 0,
        };
    },
    computed: {
        displayedCurrentTime: function () {
            if (this.isDragging == 0)
                return this.currentTime;
            else
                return this.rangeValue;
        },
    },
    watch: {
        currentTime: function () {
            if (this.isDragging == 1)
                this.isDragging = 0;
        },
    },
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
        onMouseDown: function () {
            this.isDragging = 2;
        },
        onDragging: function (e) {
            this.rangeValue = Number($(e.target).prop('value'));
        },
        onMouseUp: function () {
            this.$emit('change-current-time', this.rangeValue);
            this.isDragging = 1;
        },
    },
};

let BgmPlayer = {
    props: {
        file: {
            type: Object,
            required: true,
        },
    },
    template: `<div class="player">
        <audio
            :src="file.path"
            preload="metadata"
            @loadedmetadata="onLoadedMetaData"
            @timeupdate="onTimeUpdate"
            ></audio>
        <button type="button"></button>
        <div class="container">
            <div class="discription">
                <div class="note"></div>
                <label class="title" v-cloak>{{ file.name }}</label>
            </div>
        <TimeController
            :currentTime="currentTime" :duration="duration"
            @change-current-time="onChangeCurrentTime"
        ></TimeController>
        </div>
    </div>`,
    components: {
        TimeController,
    },
    data: function () {
        return {
            currentTime: 0,
            duration: -1,
        };
    },
    methods: {
        onLoadedMetaData: function (e) {
            this.duration = $(e.target).prop('duration');
        },
        onTimeUpdate: function (e) {
            this.currentTime = $(e.target).prop('currentTime');
        },
        onChangeCurrentTime: function (newCurrentTime) {
            $(this.$el).find('audio').prop('currentTime', newCurrentTime);
        },
    },
};

let SePlayer = {
    props: {
        file: {
            type: Object,
            required: true,
        }
    },
    template: `<div class="player">
        <div class="audios">
            <audio :src="file.path" preload="metadata"></audio>
        </div>
        <div class="play">
            <button type="button"></button>
        </div>
        <div class="container">
            <div class="discription">
                <div class="note"></div>
                <label class="title" v-cloak>{{ file.name }}</label>
            </div>
            <div class="cancel"></div>
        </div>
    </div>`,
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
            'bgm-player': BgmPlayer,
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
        components: {
            'se-player': SePlayer,
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