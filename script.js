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
            if (this.isDragging == 0) {
                return this.currentTime;
            }
            else {
                return this.rangeValue;
            }
        },
    },
    watch: {
        currentTime: function () {
            if (this.isDragging == 1) {
                this.isDragging = 0;
            }
        },
    },
    methods: {
        formatTime: function (time) {
            if (time == -1) {
                return '--:--';
            }
            let minute = Math.floor(time / 60);
            let second = Math.floor(time) % 60;
            if (minute < 10) {
                minute = '0' + minute;
            }
            if (second < 10) {
                second = '0' + second;
            }
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
        playingKey: {
            type: Number,
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
        <button
            type="button" class="play"
            :class="[ playerStatus ]"
            :disabled="!canPlay"
            @click="onClick"
        ></button>
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

            playerStatus: 'pausing',
            canPlay: true,
            fadeOutDuration: 1000, //const
        };
    },
    watch: {
        playingKey: function (newKey) {
            if (newKey < 0) {
                this.canPlay = false;
                if (newKey == -this.file.key) {
                    this.fadeOutAudio();
                }
            }
            else {
                this.canPlay = true;
                if (newKey == this.file.key) {
                    this.playAudio();
                }
                else {
                    this.playerStatus = 'pausing';
                }
            }
        },
    },
    methods: {
        onLoadedMetaData: function (e) {
            this.duration = $(e.target).prop('duration');
        },
        onTimeUpdate: function (e) {
            this.currentTime = $(e.target).prop('currentTime');
            if (this.currentTime + this.fadeOutDuration / 1000.0 >= this.duration && this.playingKey > 0) {
                this.$emit('play-request', this.file.key);
            }
        },
        onChangeCurrentTime: function (newCurrentTime) {
            $(this.$el).find('audio').prop('currentTime', newCurrentTime);
        },

        onClick: function (e) {
            this.$emit('play-request', this.file.key);
        },

        playAudio: function () {
            this.playerStatus = 'playing';
            $(this.$el).find('audio').trigger('play');
        },
        fadeOutAudio: function () {
            this.playerStatus = 'fading';
            let that = this;
            let fadeVolume = setInterval(function (audio, startTime, duration) {
                let now = Date.now();
                if (now - startTime <= duration) {
                    $(audio).prop('volume', (startTime + duration - now) / duration);
                } else {
                    clearInterval(fadeVolume);
                    $(audio).trigger('pause');
                    $(audio).prop('volume', 1.0);
                    that.$emit('standby');
                }
            }, 50,
                $(this.$el).find('audio'), Date.now(), this.fadeOutDuration);
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
                v-for="idx in audioMax" :key="idx-1"
                :data-key="idx-1"
                @ended="onEnded"
            ></audio>
        </div>
        <button
            type="button" class="play"
            :class="{ playing: playingAny }"
            :disabled="!canPlay"
            @click="onPlay"
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
            audioMax: 5, //const
        };
    },
    computed: {
        playingNum: function () {
            let num = 0;
            for (let val of this.isPlaying) {
                if (val) {
                    ++num;
                }
            }
            return num;
        },
        playingAny: function () {
            return this.playingNum > 0;
        },
        canPlay: function () {
            return this.playingNum < this.audioMax;
        },
    },
    methods: {
        onPlay: function (e) {
            let el = this.$el;
            let that = this;

            let idx = 0;
            while (this.isPlaying[idx]) {
                ++idx;
            }
            let audio = $(el).find('audio').eq(idx);
            let cancelButton = $('<button>', { type: 'button', 'data-key': idx });
            $(cancelButton).click(function (e) {
                $(audio).trigger('pause');
                $(audio).prop('currentTime', 0.0);
                Vue.set(that.isPlaying, idx, false);
                $(this).remove();
            });
            $(el).find('.cancel').append(cancelButton);

            $(audio).trigger('play');
            Vue.set(this.isPlaying, idx, true);
        },
        onEnded: function (e) {
            let idx = Number($(e.target).attr('data-key'));
            Vue.set(this.isPlaying, idx, false);
            $(this.$el).find('.cancel>button[data-key="' + idx + '"]').remove();
        }
    },
};

//Main

$(document).ready(function () {
    console.log('JavaScript file (script.js) is running.');

    //playerを追加
    new Vue({
        el: '#bgm',
        name: 'BGM',
        data: {
            //key==0: 再生中のplayer無し
            // key>0: keyに一致するplayerが再生中
            // key<0: -keyに一致するplayerがフェードアウト中
            playingKey: 0,
            requestedKey: 0,
            fileList: [
                {
                    name: 'BGMタイムスリップ1.mp3',
                    path: 'music/BGM/BGMタイムスリップ1.mp3',
                    key: 1,
                },
                {
                    name: 'BGM平安2.mp3',
                    path: 'music/BGM/BGM平安2.mp3',
                    key: 2,
                },
                {
                    name: 'BGM平安貴族.mp3',
                    path: 'music/BGM/BGM平安貴族.mp3',
                    key: 3,
                },
                {
                    name: 'Black Magic2.mp3',
                    path: 'music/BGM/Black Magic2.mp3',
                    key: 4,
                },
                {
                    name: 'BGM日常現代.mp3',
                    path: 'music/BGM/BGM日常現代.mp3',
                    key: 5,
                },
            ]
        },
        components: {
            'bgm-player': BgmPlayer,
        },
        methods: {
            onLoadLastFolder: function (e) {

            },
            onOpenFolder: function (e) {

            },
            onPlayRequest: function (key) {
                this.requestedKey = key;
                if (this.playingKey == 0) {
                    this.playingKey = key;
                }
                else {
                    this.playingKey = -this.playingKey
                }
            },
            onStandby: function () {
                if (this.playingKey == -this.requestedKey) {
                    this.playingKey = 0;
                }
                else {
                    this.playingKey = this.requestedKey;
                }
            },
        },
    });
    new Vue({
        el: '#se',
        name: 'SE',
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
        name: 'Preload',
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
});