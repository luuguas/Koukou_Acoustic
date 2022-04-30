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
                <label class="title">{{ file.name }}</label>
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
            <audio
                :src="file.path" preload="metadata"
                v-for="idx in 5" :key="idx"
            ></audio>
        </div>
        <button
            type="button" class="play"
            :class="{ playing: playingAny }"
            :disabled="!canPlay"
        ></button>
        <div class="container">
            <div class="discription">
                <div class="note"></div>
                <label class="title">{{ file.name }}</label>
            </div>
            <div class="cancel"></div>
        </div>
    </div>`,
    data: function () {
        return {
            isPlaying: [false, false, false, false, false],
        };
    },
    computed: {
        playingNum: function () {
            let num = 0;
            for (let val of this.isPlaying) {
                if (val) { ++num; }
            }
            return num;
        },
        playingAny: function () {
            return this.playingNum > 0;
        },
        canPlay: function () {
            return this.playingNum < 5;
        },
    },
    mounted: function () {
        let el = this.$el;
        let that = this;
        let playButton = $(el).find('.play');

        $(playButton).click(function (e) {
            let idx = 0;
            while (that.isPlaying[idx]) ++idx;

            let cancelButton = $('<button>', { type: 'button', key: idx });
            $(cancelButton).click(function (e) {
                let idx = Number($(this).attr('key'));
                $(el).find('audio').eq(idx).trigger('pause');
                $(el).find('audio').eq(idx).prop('currentTime', 0.0);
                Vue.set(that.isPlaying, idx, false);
                $(this).remove();
            });
            $(el).find('.cancel').append(cancelButton);

            $(el).find('audio').eq(idx).trigger('play');
            Vue.set(that.isPlaying, idx, true);
        });

        $(el).find('audio').each(function (idx, val) {
            $(val).on('ended', function (e) {
                Vue.set(that.isPlaying, idx, false);
                $(el).find('.cancel>button[key="' + idx + '"]').remove();
            });
        });
    },
};

//Main

$(document).ready(function () {
    console.log('JavaScript file (script.js) is running.');

    //playerを追加
    new Vue({
        el: '#bgm',
        data: {
            fileList: [
                {
                    name: 'BGMタイムスリップ1.mp3',
                    path: 'music/BGM/BGMタイムスリップ1.mp3',
                    key: 0,
                },
                {
                    name: 'BGM平安2.mp3',
                    path: 'music/BGM/BGM平安2.mp3',
                    key: 1,
                },
                {
                    name: 'BGM平安貴族.mp3',
                    path: 'music/BGM/BGM平安貴族.mp3',
                    key: 2,
                },
                {
                    name: 'Black Magic2.mp3',
                    path: 'music/BGM/Black Magic2.mp3',
                    key: 3,
                },
                {
                    name: 'BGM日常現代.mp3',
                    path: 'music/BGM/BGM日常現代.mp3',
                    key: 4,
                },
            ]
        },
        components: {
            'bgm-player': BgmPlayer,
        },
        computed: {

        },
    });
    new Vue({
        el: '#se',
        data: {
            fileList: [
                {
                    name: 'スマホのタップ音.mp3',
                    path: 'music/SE/スマホのタップ音.mp3',
                    key: 0,
                },
                {
                    name: 'アラーム.mp3',
                    path: 'music/SE/アラーム.mp3',
                    key: 1,
                },
                {
                    name: 'ドア現代.mp3',
                    path: 'music/SE/ドア現代.mp3',
                    key: 2,
                },
                {
                    name: '走る.mp3',
                    path: 'music/SE/走る.mp3',
                    key: 3,
                },
                {
                    name: '自動車事故.mp3',
                    path: 'music/SE/自動車事故.mp3',
                    key: 4,
                },
                {
                    name: 'スマホ破壊音.mp3',
                    path: 'music/SE/スマホ破壊音.mp3',
                    key: 5,
                },
                {
                    name: '喧嘩.mp3',
                    path: 'music/SE/喧嘩.mp3',
                    key: 6,
                },
                {
                    name: 'ショック.mp3',
                    path: 'music/SE/ショック.mp3',
                    key: 7,
                },
                {
                    name: '思いつく1.mp3',
                    path: 'music/SE/思いつく1.mp3',
                    key: 8,
                },
                {
                    name: '羽子板3.mp3',
                    path: 'music/SE/羽子板3.mp3',
                    key: 9,
                },
                {
                    name: '笛.mp3',
                    path: 'music/SE/笛.mp3',
                    key: 10,
                },
                {
                    name: '笛2.mp3',
                    path: 'music/SE/笛2.mp3',
                    key: 11,
                },
                {
                    name: '開門.mp3',
                    path: 'music/SE/開門.mp3',
                    key: 12,
                },
                {
                    name: 'きらきら輝く2.mp3',
                    path: 'music/SE/きらきら輝く2.mp3',
                    key: 13,
                },
                {
                    name: '馬のいななき.mp3',
                    path: 'music/SE/馬のいななき.mp3',
                    key: 14,
                },
                {
                    name: '馬が走る1.mp3',
                    path: 'music/SE/馬が走る1.mp3',
                    key: 15,
                },
                {
                    name: '馬と衝突1.mp3',
                    path: 'music/SE/馬と衝突1.mp3',
                    key: 16,
                },
                {
                    name: '車の走行音.mp3',
                    path: 'music/SE/車の走行音.mp3',
                    key: 17,
                },
                {
                    name: 'スマホ破壊音.mp3',
                    path: 'music/SE/スマホ破壊音.mp3',
                    key: 18,
                },
            ]
        },
        components: {
            'se-player': SePlayer,
        },
        computed: {

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
});