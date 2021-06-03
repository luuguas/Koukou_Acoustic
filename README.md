README.md - ***Ver1.1.0 (Pre-Release)***

<br>

# Koukou_Acoustic
Web Application of Acoustic Equipment for Play

劇で使える音響用のWebアプリ 

# 使い方
## 起動
index.htmlをブラウザで開きます。

Chrome及びMicrosoft Edgeでは動作を確認しています。他のブラウザはサポート対象外です。<br>

![open](https://user-images.githubusercontent.com/69027878/120658295-424c6580-c4c0-11eb-9c9a-9923c2bbeec1.png)

## アプリの操作
### BGM
再生ボタンを押すと再生します。シークバーをドラッグすると再生時間を変更できます。

既にBGMを再生しているときにそのBGMを一時停止する時や、他のBGMを再生するときは、現在再生中のBGMの音量がフェードアウトしてから切り替わります。
フェードアウト中は再生ボタンは操作できません。

BGMが終了間近になった時も自動でフェードアウトします。

![bgm](https://user-images.githubusercontent.com/69027878/120659264-29907f80-c4c1-11eb-8056-149d6c4d637e.png)

### 効果音(SE)
クラッカーのボタンを押すと効果音が再生されます。同時に5回まで再生できます。

効果音を途中で止めたいときは停止ボタンをクリックしてください。停止ボタンは再生開始の早い順に並んでいます。

![se](https://user-images.githubusercontent.com/69027878/120660248-19c56b00-c4c2-11eb-992b-0f79a1e697b8.png)

## 音の変更
### 音楽ファイルの移動
musicフォルダ内にはBGMフォルダとSEフォルダがあります。

BGMフォルダ直下にBGMとして使う音楽ファイルを、SEフォルダ直下に効果音として使う音楽ファイルをそれぞれ移動してください。必要のないファイルはフォルダ内から削除してしまって構いません。

![music](https://user-images.githubusercontent.com/69027878/120661567-5d6ca480-c4c3-11eb-8ed6-afc8328f1a4d.png)

↓

![sef](https://user-images.githubusercontent.com/69027878/120661634-6b222a00-c4c3-11eb-8a20-228d52ec786a.png)

↓

![inse](https://user-images.githubusercontent.com/69027878/120661673-7412fb80-c4c3-11eb-945f-82fd864c36ee.png)

### 音楽ファイルをアプリに適用
script.jsを[編集(E)]で開いてください。

![js](https://user-images.githubusercontent.com/69027878/120662182-e2f05480-c4c3-11eb-87ef-25ee2e3f8a52.png)

メモ帳が表示されたら、音声ファイルが指定されている箇所に移動します。(87行~)

```javascript
new Vue({
    el: '#bgm',
    data: {
        fileNames: [
            'タイムスリップ.mp3',
            'BGM平安2.mp3',
            'BGM平安貴族.mp3',
            'Black Magic1.mp3',
            'BGM日常現代.mp3',
        ]
    },    
    ...
    });
    new Vue({
        el: '#se',
        data: {
            fileNames: [
                'スマホのタップ音.mp3',
                'アラーム.mp3',
                'ドア現代.mp3',
                '走る.mp3',
                ...
            ]
        },
        ...
    });
```
と音声ファイルの名前がリストアップされているので、その箇所を編集し、適用させたい音楽ファイルのファイル名を` '(ファイル名)', `の形式で指定します。(拡張子を含む)

BGMは`el: '#bgm'`直下のリスト、効果音は`el: '#se'`直下のリストを編集して適用させます。その他のコードは書き換えないでください。
