これを動かすためには、git cloneで取得したフォルダの一番浅い階層に.envファイルを作成して以下の内容を記述してください。
+ GEMINI_API_KEY="あなたのAPI KEY"
+ VITE_GOOGLE_CLIENT_ID="GCPで取得したID"
+ GOOGLE_CLIENT_ID="GCPで取得したID"
+ GOOGLE_CLIENT_SECRET="GCPで取得したクライアントシークレットのキー"

記述後にnode.jsとnpmをインストールし、以下のコマンドを入力したら動作する。
+ npm run dev
+ node server.js

```mermaid
graph TD
    subgraph user_terminal [ユーザー端末]
        A["<b>健康管理アプリ</b>"]
    end

    subgraph cloud_server [クラウド/サーバー]
        B["<b>アプリケーションサーバー</b><br>ビジネスロジック、ユーザー認証"]
        C["<b>データベース(DB)</b><br>ユーザー情報、健康記録、報酬データ"]
        D["<b>AI分析エンジン</b><br>体重予測、アドバイス生成"]
        E["<b>通知サーバー</b><br>リマインダー通知"]
    end

    subgraph external_services [外部サービス]
        F["<b>広告配信サービス</b><br>(AdMob, etc.)"]
        G["<b>スマートウォッチ連携API</b><br>(Apple HealthKit, Google Fit API)"]
    end

    A -- "データ記録・閲覧 (API通信)" --> B
    B -- "データの読み書き" --> C
    B -- "分析リクエスト" --> D
    D -- "分析結果" --> B
    B -- "通知リクエスト" --> E
    E -- "プッシュ通知" --> A
    
    A -- "広告リクエスト/表示" --> F
    A -- "健康データ取得" --> G

    %% スタイリング (修正箇所)
    %% 日本語の subgraph 名の代わりに英数字のIDを指定
    style user_terminal fill:#e3f2fd,stroke:#333,stroke-width:2px
    style cloud_server fill:#f1f8e9,stroke:#333,stroke-width:2px
    style external_services fill:#fff9c4,stroke:#333,stroke-width:1px
```
