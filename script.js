//VueDraggableをインポート
const draggable = window['vuedraggable'];

/* データベース操作 */
let database = null;
let loading = false;
const databaseName = 'Koukou_Acoustic';
const storeName = 'setting';
const mode = { mode: 'read' };

const bgm_dirKey = 'bgm';
const bgm_idxsKey = 'bgm-indexs';
const bgm_fadeOutKey = 'bgm-fadeout';
const se_dirKey = 'se';
const se_idxsKey = 'se-indexs';

//データベース操作関数(非同期)
function getDatabase(databaseName) {
    return new Promise(async (resolve, reject) => {
        let openRequest = indexedDB.open(databaseName);
        openRequest.onerror = () => {
            console.error('Failed to get Database.');
            reject(null);
        };
        openRequest.onupgradeneeded = (e) => {
            console.info('Created new Database.');
            let newDatabase = e.target.result;
            newDatabase.createObjectStore(storeName, { keyPath: 'key' });
        };
        openRequest.onsuccess = (e) => {
            //console.log('Succeeded in getting Database.');
            resolve(e.target.result);
        };
    });
}
function saveDataToDatabase(key, value) {
    return new Promise(async (resolve, reject) => {
        if (!database) {
            database = await getDatabase(databaseName);
        }
        let trans = database.transaction(storeName, 'readwrite');
        let store = trans.objectStore(storeName);
        let addRequest = store.put({ key, value });
        addRequest.onerror = () => {
            console.error('Failed to save "' + key + '".');
            reject(false);
        };
        addRequest.onsuccess = () => {
            //console.log('Succeeded in saving "' + key + '".');
            resolve(true);
        };
    });
}
function getDataFromDatabase(key) {
    return new Promise(async (resolve, reject) => {
        if (!database) {
            database = await getDatabase(databaseName);
        }
        let trans = database.transaction(storeName, 'readonly');
        let store = trans.objectStore(storeName);
        let getRequest = store.get(key);
        getRequest.onerror = () => {
            console.error('Failed to load "' + key + '".');
            reject(null);
        };
        getRequest.onsuccess = (e) => {
            if (e.target.result) {
                //console.log('Succeeded in loading "' + key + '".');
                resolve(e.target.result.value);
            }
            else {
                //console.log('Succeeded in loading "' + key + '", but it was undefined.');
                resolve(null);
            }
        }
    });
}
function deleteDataFromDatabase(key) {
    return new Promise(async (resolve, reject) => {
        if (!database) {
            database = await getDatabase(databaseName);
        }
        let trans = database.transaction(storeName, 'readwrite');
        let store = trans.objectStore(storeName);
        let deleteRequest = store.delete(key);
        deleteRequest.onerror = () => {
            console.error('Failed to delete "' + key + '".');
            reject(false);
        };
        deleteRequest.onsuccess = () => {
            //console.log('Succeeded in deleting "' + key + '".');
            resolve(true);
        };
    });
}

/* コンポーネントとミックスイン */
let historySavable = { //mixin
    data: function () {
        return {
            dirKey: '',
            idxsKey: '',
            openingDirectory: null,
        };
    },
    methods: {
        hasLastLoadedDirectory: async function () {
            let directoryHandle = await getDataFromDatabase(this.dirKey);
            return directoryHandle !== null;
        },
        saveLastLoadedDirectory: function (directoryHandle) {
            saveDataToDatabase(this.dirKey, directoryHandle);
        },
        getIndexsHistories: async function () {
            let indexsHistories = await getDataFromDatabase(this.idxsKey);
            if (indexsHistories === null) {
                indexsHistories = [];
            }
            return indexsHistories;
        },
        getIndexs: async function (directoryHandle) {
            let indexsHistories = await this.getIndexsHistories();
            for (let x of indexsHistories) {
                if (await directoryHandle.isSameEntry(x.directory)) {
                    return x.indexs;
                }
            }
            return { num: 0 };
        },
        saveIndexs: async function (directoryHandle, indexs) {
            let indexsHistories = await this.getIndexsHistories();
            for (let x of indexsHistories) {
                if (await directoryHandle.isSameEntry(x.directory)) {
                    x.indexs = indexs;
                    saveDataToDatabase(this.idxsKey, indexsHistories);
                    return;
                }
            }
            indexsHistories.push({ directory: directoryHandle, indexs });
            saveDataToDatabase(this.idxsKey, indexsHistories);
        },
    },
};

let DirectoryReader = { //component
    props: {
        dirKey: {
            type: String,
            required: true,
        },
        hasDirectoryHistory: {
            type: Boolean,
            required: true,
        },
    },
    methods: {
        onLoadLastFolder: async function (e) {
            let directoryHandle = await getDataFromDatabase(this.dirKey);
            if (await directoryHandle.queryPermission(mode) !== 'granted' && await directoryHandle.requestPermission(mode) !== 'granted') {
                //console.log('loading "' + directoryHandle.name + '" was rejected.');
                return;
            }
            this.$emit('load-directory', directoryHandle);
        },
        onOpenFolder: async function (e) {
            try {
                let directoryHandle = await window.showDirectoryPicker();
                this.$emit('load-directory', directoryHandle);
                saveDataToDatabase(this.dirKey, directoryHandle);
            }
            catch (e) {
                //console.log(e.message);
            }
        },
    },
    template: `<div class="file">
        <button
            type="button" class="load-last-folder"
            :disabled="!hasDirectoryHistory"
            @click="onLoadLastFolder"
        >前回のフォルダを開く</button>
        <button
            type="button" class="open-folder"
            @click="onOpenFolder"
        >フォルダを開く...</button>
    </div>`,
};
let directoryReadable = { //mixin
    components: {
        DirectoryReader,
    },
    mixins: [historySavable],
    data: function () {
        return {
            hasDirectoryHistory: true,
            openingDirectory: null,
            indexs: {},
            nextKey: 1,
        };
    },
    created: async function () {
        this.hasDirectoryHistory = await this.hasLastLoadedDirectory();
    },
    methods: {
        onLoadDirectory: async function (e) {
            this.fileList = [];
            let directoryHandle = e;
            this.openingDirectory = directoryHandle;
            this.saveLastLoadedDirectory(directoryHandle);
            let indexsHistory = await this.getIndexs(directoryHandle);
            if (this.playingKey > 0) {
                this.playingKey = 0;
                this.requestedKey = 0;
            }
            let indexs = {};
            this.fileList = await new Promise(async (resolve, reject) => {
                let fileList = [];
                let pathRequests = [];
                let idx = 0;
                let extraIdx = indexsHistory.num;
                for await (let handle of directoryHandle.values()) {
                    await new Promise(async (resolve, reject) => {
                        if (handle.kind === 'file') {
                            let file = await handle.getFile();
                            if (file.type.match('audio.*')) {
                                if (indexsHistory[file.name] === undefined) {
                                    indexs[file.name] = extraIdx++;
                                }
                                else {
                                    indexs[file.name] = indexsHistory[file.name];
                                }

                                fileList.push({
                                    name: file.name,
                                    path: '',
                                    key: this.nextKey + idx,
                                });
                                pathRequests.push(
                                    new Promise((resolve, reject) => {
                                        let i = idx;
                                        let reader = new FileReader();
                                        reader.onload = (e) => {
                                            fileList[i].path = e.target.result;
                                            resolve();
                                        };
                                        reader.readAsDataURL(file);
                                    })
                                );
                                ++idx;
                            }
                        }
                        resolve();
                    });
                }
                indexs['num'] = idx;
                this.nextKey += idx;
                await Promise.all(pathRequests);
                fileList.sort((l, r) => {
                    return indexs[l.name] - indexs[r.name];
                });
                $.each(fileList, function (idx, val) {
                    indexs[val.name] = idx;
                });
                resolve(fileList);
            });
            this.saveIndexs(directoryHandle, indexs);
            this.hasDirectoryHistory = true;
            this.$emit('change-history', { hasDirectoryHistory: true, hasIndexsHistories: true });
        },
    },
};

let panelsDraggable = { //mixin
    components: {
        draggable,
    },
    mixins: [historySavable],
    data: function () {
        return {
            indexs: {},
            dragOptions: {
                animation: 200,
                disabled: false,
                ghostClass: "ghost",
                handle: '.handle',
            },
        };
    },
    methods: {
        onEnd: function (e) {
            let that = this;
            $.each(this.fileList, function (idx, val) {
                that.indexs[val.name] = idx;
            });
            this.saveIndexs(this.openingDirectory, this.indexs);
            this.$emit('change-history', { hasDirectoryHistory: true, hasIndexsHistories: true });
        }
    }
};

let TimeController = { //component
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
        canPlay: {
            type: Boolean,
            required: true,
        },
    },
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
    template: `<div class="controller">
        <div class="time">
            <label class="time-current">{{ formatTime(displayedCurrentTime) }}</label>
            <label class="time-div">/</label>
            <label class="time-duration">{{ formatTime(duration) }}</label>
        </div>
        <input
            type="range" class="seekbar"
            min="0" :max="duration" step="0.001" :value="displayedCurrentTime" 
            :disabled="!canPlay"
            @mousedown="onMouseDown" @input="onDragging" @mouseup="onMouseUp"
        >
    </div>`,
};
let BgmPlayer = { //component
    components: {
        TimeController,
    },
    props: {
        file: {
            type: Object,
            required: true,
        },
        playingKey: {
            type: Number,
            required: true,
        },
        fadeOutDuration: {
            type: Number,
            required: true,
        }
    },
    data: function () {
        return {
            currentTime: 0,
            duration: -1,

            playerStatus: 'pausing',
            canPlay: false,
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
            this.canPlay = true;
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
            if (this.fadeOutDuration == 0) {
                $(this.$el).find('audio').trigger('pause');
                this.$emit('standby');
                return;
            }
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
                <span class="title">{{ file.name }}</span>
            </div>
            <TimeController
                :currentTime="currentTime" :duration="duration"
                :canPlay="canPlay"
                @change-current-time="onChangeCurrentTime"
            ></TimeController>
        </div>
        <div class="handle"></div>
    </div>`,
};
let Bgm = { //component
    components: {
        BgmPlayer,
    },
    mixins: [directoryReadable, panelsDraggable],
    data: function () {
        return {
            dirKey: bgm_dirKey,
            idxsKey: bgm_idxsKey,
            fadeOutKey: bgm_fadeOutKey,
            //key==0: 再生中のplayer無し
            // key>0: keyに一致するplayerが再生中
            // key<0: -keyに一致するplayerがフェードアウト中
            playingKey: 0,
            requestedKey: 0,
            fileList: [],
            fadeOutDuration: 0.0,
        };
    },
    created: async function () {
        let request = await getDataFromDatabase(this.fadeOutKey);
        if (request === null) {
            this.fadeOutDuration = 1000;
            saveDataToDatabase(this.fadeOutKey, 1000);
        }
        else {
            this.fadeOutDuration = request;
        }
    },
    methods: {
        onFadeOutDurationChange: function (e) {
            saveDataToDatabase(this.fadeOutKey, Number(e.target.value));
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
    template: `<div id="bgm">
        <h2>BGM</h2>
        <div class="setting">
            <DirectoryReader
                :dirKey="dirKey" :hasDirectoryHistory="hasDirectoryHistory"
                @load-directory="onLoadDirectory"
            ></DirectoryReader>
            <div class="fadeout">
                <label>一時停止時のフェードアウト:</label>
                <select class="fadeout-select" v-model="fadeOutDuration" @change="onFadeOutDurationChange">
                    <option :value="0" selected>なし</option>
                    <option :value="500">0.5秒</option>
                    <option :value="1000">1.0秒</option>
                    <option :value="1500">1.5秒</option>
                    <option :value="2000">2.0秒</option>
                    <option :value="2500">2.5秒</option>
                    <option :value="3000">3.0秒</option>
                </select>
            </div>
        </div>
        <draggable v-model="fileList" v-bind="dragOptions" @end="onEnd">
            <transition-group class="panels">
                <BgmPlayer
                    :file="file" :playingKey="playingKey" :fadeOutDuration="fadeOutDuration"
                    v-for="file in fileList" :key="file.key"
                    @play-request="onPlayRequest"
                    @standby="onStandby"
                ></BgmPlayer>
            </transition-group>
        </draggable>
    </div>`,
};

let SePlayer = { //component
    props: {
        file: {
            type: Object,
            required: true,
        }
    },
    data: function () {
        return {
            isPlaying: [false, false, false, false, false],
            audioMax: 5, //const
            loadedAudiosNum: 0,
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
            return this.loadedAudiosNum >= this.audioMax && this.playingNum < this.audioMax;
        },
    },
    methods: {
        onLoadedMetaData: function () {
            ++this.loadedAudiosNum;
        },
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
    template: `<div class="player">
        <div class="audios">
            <audio
                :src="file.path" preload="metadata"
                v-for="idx in audioMax" :key="idx-1"
                :data-key="idx-1"
                @loadedmetadata="onLoadedMetaData" @ended="onEnded"
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
                <span class="title">{{ file.name }}</span>
            </div>
            <div class="cancel"></div>
        </div>
        <div class="handle"></div>
    </div>`,
};
let Se = { //component
    components: {
        SePlayer,
    },
    mixins: [directoryReadable, panelsDraggable],
    data: function () {
        return {
            dirKey: se_dirKey,
            idxsKey: se_idxsKey,
            fileList: [],
        };
    },
    template: `<div id="se">
        <h2>SE</h2>
        <DirectoryReader
            :dirKey="dirKey" :hasDirectoryHistory="hasDirectoryHistory"
            @load-directory="onLoadDirectory"
        ></DirectoryReader>
        <draggable v-model="fileList" v-bind="dragOptions" @end="onEnd">
            <transition-group class="panels">
                <SePlayer
                    :file="file"
                    v-for="file in fileList" :key="file.key"
                ></SePlayer>
            </transition-group>
        </draggable>
    </div>`,
};

$(document).ready(function () {
    //アプリをインスタンス化
    new Vue({
        el: '#app',
        name: 'App',
        components: {
            Bgm,
            Se,
        },
        data: {
            hasDirectoryHistory: true,
            hasIndexsHistories: true,
        },
        created: async function () {
            if (await getDataFromDatabase(bgm_dirKey) === null && await getDataFromDatabase(se_dirKey) === null) {
                this.hasDirectoryHistory = false;
            }
            if (await getDataFromDatabase(bgm_idxsKey) === null && await getDataFromDatabase(se_idxsKey) === null) {
                this.hasIndexsHistories = false;
            }
        },
        methods: {
            onChangeHistory: function (e) {
                this.hasDirectoryHistory = e.hasDirectoryHistory;
                this.hasIndexsHistories = e.hasIndexsHistories;
            },
            onLoadLastFolder: async function (e) {
                if (await getDataFromDatabase(bgm_dirKey) !== null) {
                    $('#bgm .load-last-folder').trigger('click');
                }
                if (await getDataFromDatabase(se_dirKey) !== null) {
                    $('#se .load-last-folder').trigger('click');
                }
            },
            onDeleteIndexsHistories: function (e) {
                let deleteRequest = window.confirm('履歴を削除してもよろしいですか?');
                if (deleteRequest) {
                    deleteDataFromDatabase(bgm_idxsKey);
                    deleteDataFromDatabase(se_idxsKey);
                    window.alert('履歴を削除しました。');
                    this.hasIndexsHistories = false;
                }
            },
        },
    });

    //画像のプレロード
    new Vue({
        el: '#preload',
        name: 'Preload',
        data: {
            imageList: [
                'Cracker.svg',
                'Cracker_Disabled.svg',
                'Cracker_Playing.svg',
                'Handle.svg',
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
                return $.map(this.imageList, (val, idx) => {
                    return 'image/' + val;
                });
            },
        },
    });
});