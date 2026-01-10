# Ruby on Rails - 技術面接対策

## 概要

Ruby on Rails の基礎知識。MVC、Active Record、パフォーマンス、セキュリティなど。

---

## 1. Rails の基本概念

### MVC アーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│                      リクエスト                          │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                       Router                             │
│              routes.rb でルーティング定義                 │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                     Controller                           │
│           リクエスト処理、レスポンス生成                   │
└─────────────────────────────────────────────────────────┘
                     ↓           ↓
┌─────────────────────┐   ┌─────────────────────────────┐
│        Model        │   │           View              │
│   ビジネスロジック   │   │      HTML/JSON 生成         │
│   データアクセス     │   │                             │
└─────────────────────┘   └─────────────────────────────┘
```

### Convention over Configuration（設定より規約）

| 規約 | 例 |
|------|-----|
| テーブル名 | モデル名の複数形（`User` → `users`） |
| 主キー | `id` |
| 外部キー | `<モデル名>_id`（`user_id`） |
| タイムスタンプ | `created_at`, `updated_at` |
| コントローラ | `<モデル名複数形>Controller` |

---

## 2. Active Record

### N+1 問題

```ruby
# 悪い例（N+1）
users = User.all
users.each do |user|
  puts user.posts.count  # ユーザーごとにクエリ発行
end

# 良い例（Eager Loading）
users = User.includes(:posts)
users.each do |user|
  puts user.posts.count  # キャッシュ済み
end
```

### Eager Loading の種類

| メソッド | 説明 | SQL |
|----------|------|-----|
| `includes` | 適切な方法を自動選択 | 状況に応じて変わる |
| `preload` | 別クエリで取得 | `SELECT * FROM posts WHERE user_id IN (...)` |
| `eager_load` | LEFT OUTER JOIN | `SELECT * FROM users LEFT OUTER JOIN posts ON ...` |
| `joins` | INNER JOIN（関連データは取得しない） | `SELECT * FROM users INNER JOIN posts ON ...` |

### 使い分け

```ruby
# 関連データを使う場合
User.includes(:posts)

# 関連データでフィルタリングする場合
User.joins(:posts).where(posts: { published: true })

# 両方の場合
User.includes(:posts).where(posts: { published: true }).references(:posts)
```

### N+1 検出

```ruby
# Gemfile
gem 'bullet', group: :development

# config/environments/development.rb
config.after_initialize do
  Bullet.enable = true
  Bullet.alert = true
  Bullet.bullet_logger = true
end
```

---

## 3. スコープとクエリ

### スコープの定義

```ruby
class Post < ApplicationRecord
  # 基本的なスコープ
  scope :published, -> { where(published: true) }
  scope :recent, -> { order(created_at: :desc) }

  # 引数付きスコープ
  scope :by_author, ->(author_id) { where(author_id: author_id) }

  # 日付関連
  scope :created_after, ->(date) { where('created_at > ?', date) }

  # チェーン可能
  scope :recent_published, -> { published.recent }
end

# 使用
Post.published.recent.limit(10)
Post.by_author(user.id).created_after(1.week.ago)
```

### クラスメソッド vs スコープ

```ruby
class Post < ApplicationRecord
  # スコープ（nil を返すとき all を返す）
  scope :published, -> { where(published: true) }

  # クラスメソッド（nil を返すとき nil のまま）
  def self.published
    where(published: true)
  end
end
```

---

## 4. コールバック

### ライフサイクル

```ruby
class User < ApplicationRecord
  # 作成前
  before_validation :normalize_email
  before_save :encrypt_password
  before_create :generate_token

  # 作成後
  after_create :send_welcome_email
  after_commit :sync_to_external_service, on: :create

  # 更新
  before_update :log_changes
  after_update :notify_changes

  # 削除
  before_destroy :check_dependencies
  after_destroy :cleanup_files

  private

  def normalize_email
    self.email = email.downcase.strip if email.present?
  end
end
```

### コールバックの注意点

| 問題 | 対策 |
|------|------|
| テストが難しくなる | Service Object に切り出す |
| 予期しない副作用 | 明示的なメソッド呼び出しを検討 |
| トランザクションの問題 | `after_commit` を使用 |
| 条件付き実行 | `if:` / `unless:` オプション |

```ruby
# 条件付きコールバック
after_create :send_notification, if: :should_notify?

# after_commit でトランザクション完了後に実行
after_commit :sync_external, on: [:create, :update]
```

---

## 5. バリデーション

### 基本的なバリデーション

```ruby
class User < ApplicationRecord
  # 存在チェック
  validates :name, presence: true

  # 一意性
  validates :email, uniqueness: { case_sensitive: false }

  # フォーマット
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }

  # 長さ
  validates :password, length: { minimum: 8, maximum: 72 }

  # 数値
  validates :age, numericality: { greater_than: 0, less_than: 150 }

  # 含まれる値
  validates :role, inclusion: { in: %w[admin user guest] }

  # カスタムバリデーション
  validate :password_complexity

  private

  def password_complexity
    return if password.blank?

    unless password.match?(/[A-Z]/) && password.match?(/[0-9]/)
      errors.add(:password, 'must include uppercase and number')
    end
  end
end
```

### 条件付きバリデーション

```ruby
class User < ApplicationRecord
  validates :company_name, presence: true, if: :business_account?
  validates :phone, presence: true, on: :update
  validates :terms, acceptance: true, on: :create
end
```

---

## 6. アソシエーション

### 基本的な関連

```ruby
class User < ApplicationRecord
  has_many :posts, dependent: :destroy
  has_many :comments, through: :posts
  has_one :profile, dependent: :destroy
  belongs_to :organization, optional: true
end

class Post < ApplicationRecord
  belongs_to :user
  has_many :comments, dependent: :destroy
  has_and_belongs_to_many :tags
end
```

### dependent オプション

| オプション | 動作 |
|-----------|------|
| `:destroy` | 関連レコードも削除（コールバック実行） |
| `:delete_all` | 関連レコードを直接削除（コールバックなし） |
| `:nullify` | 外部キーを NULL に設定 |
| `:restrict_with_error` | 関連があれば削除を禁止（エラー） |
| `:restrict_with_exception` | 関連があれば例外を発生 |

### ポリモーフィック関連

```ruby
class Comment < ApplicationRecord
  belongs_to :commentable, polymorphic: true
end

class Post < ApplicationRecord
  has_many :comments, as: :commentable
end

class Article < ApplicationRecord
  has_many :comments, as: :commentable
end
```

---

## 7. マイグレーション

### 基本的なマイグレーション

```ruby
class CreateUsers < ActiveRecord::Migration[7.0]
  def change
    create_table :users do |t|
      t.string :name, null: false
      t.string :email, null: false
      t.string :password_digest
      t.references :organization, foreign_key: true
      t.timestamps
    end

    add_index :users, :email, unique: true
  end
end
```

### 大規模テーブルでの注意点

```ruby
# 悪い例：テーブルロックが発生
class AddColumnToLargeTable < ActiveRecord::Migration[7.0]
  def change
    add_column :large_table, :new_column, :string, default: 'value'
  end
end

# 良い例：段階的に変更
class AddColumnToLargeTable < ActiveRecord::Migration[7.0]
  def change
    # 1. カラム追加（デフォルトなし）
    add_column :large_table, :new_column, :string
  end
end

class BackfillNewColumn < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def up
    # 2. バッチ更新
    LargeTable.in_batches.update_all(new_column: 'value')
  end
end
```

---

## 8. パフォーマンス最適化

### クエリ最適化

```ruby
# 必要なカラムだけ取得
User.select(:id, :name, :email)

# 件数だけ必要な場合
User.count  # SELECT COUNT(*) FROM users

# 存在確認
User.exists?(email: 'test@example.com')  # SELECT 1 FROM users WHERE ... LIMIT 1

# バッチ処理
User.find_each(batch_size: 1000) do |user|
  user.process_something
end

# プラック（単一カラム取得）
User.pluck(:email)  # ['a@example.com', 'b@example.com']
```

### Fragment Caching

```erb
<%# app/views/posts/_post.html.erb %>
<% cache post do %>
  <div class="post">
    <h2><%= post.title %></h2>
    <p><%= post.body %></p>
  </div>
<% end %>
```

### Russian Doll Caching

```erb
<% cache @posts do %>
  <% @posts.each do |post| %>
    <% cache post do %>
      <%= render post %>
    <% end %>
  <% end %>
<% end %>
```

### Counter Cache

```ruby
class Comment < ApplicationRecord
  belongs_to :post, counter_cache: true
end

# posts テーブルに comments_count カラムが必要
# マイグレーション
add_column :posts, :comments_count, :integer, default: 0
```

---

## 9. 認証・認可

### has_secure_password

```ruby
class User < ApplicationRecord
  has_secure_password

  validates :password, length: { minimum: 8 }, if: :password_required?

  private

  def password_required?
    new_record? || password.present?
  end
end

# 使用
user = User.create(name: 'Test', email: 'test@example.com', password: 'password123')
user.authenticate('password123')  # => user
user.authenticate('wrong')        # => false
```

### Devise

```ruby
class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :confirmable, :lockable, :trackable
end
```

### 認可（Pundit）

```ruby
# app/policies/post_policy.rb
class PostPolicy < ApplicationPolicy
  def update?
    record.user == user || user.admin?
  end

  def destroy?
    user.admin?
  end

  class Scope < Scope
    def resolve
      if user.admin?
        scope.all
      else
        scope.where(user: user)
      end
    end
  end
end

# コントローラ
class PostsController < ApplicationController
  def update
    @post = Post.find(params[:id])
    authorize @post
    # ...
  end

  def index
    @posts = policy_scope(Post)
  end
end
```

---

## 10. バックグラウンドジョブ

### Active Job

```ruby
# app/jobs/send_email_job.rb
class SendEmailJob < ApplicationJob
  queue_as :default

  retry_on StandardError, wait: :exponentially_longer, attempts: 5
  discard_on ActiveJob::DeserializationError

  def perform(user_id, email_type)
    user = User.find(user_id)
    UserMailer.send(email_type, user).deliver_now
  end
end

# 使用
SendEmailJob.perform_later(user.id, :welcome)
SendEmailJob.set(wait: 1.hour).perform_later(user.id, :reminder)
```

### Sidekiq

```ruby
# config/application.rb
config.active_job.queue_adapter = :sidekiq

# config/sidekiq.yml
:concurrency: 5
:queues:
  - critical
  - default
  - low
```

---

## 11. API モード

### Rails API

```ruby
# config/application.rb
module MyApp
  class Application < Rails::Application
    config.api_only = true
  end
end

# コントローラ
class Api::V1::PostsController < ApplicationController
  def index
    posts = Post.includes(:user).page(params[:page])
    render json: posts, each_serializer: PostSerializer
  end

  def create
    post = current_user.posts.build(post_params)

    if post.save
      render json: post, status: :created
    else
      render json: { errors: post.errors }, status: :unprocessable_entity
    end
  end
end
```

### Serializer（Active Model Serializers）

```ruby
class PostSerializer < ActiveModel::Serializer
  attributes :id, :title, :body, :created_at

  belongs_to :user
  has_many :comments

  def created_at
    object.created_at.iso8601
  end
end
```

---

## 12. テスト

### RSpec 基本

```ruby
# spec/models/user_spec.rb
RSpec.describe User, type: :model do
  describe 'validations' do
    it { is_expected.to validate_presence_of(:email) }
    it { is_expected.to validate_uniqueness_of(:email).case_insensitive }
  end

  describe 'associations' do
    it { is_expected.to have_many(:posts).dependent(:destroy) }
  end

  describe '#full_name' do
    let(:user) { build(:user, first_name: 'John', last_name: 'Doe') }

    it 'returns the full name' do
      expect(user.full_name).to eq('John Doe')
    end
  end
end
```

### FactoryBot

```ruby
# spec/factories/users.rb
FactoryBot.define do
  factory :user do
    sequence(:email) { |n| "user#{n}@example.com" }
    name { Faker::Name.name }
    password { 'password123' }

    trait :admin do
      role { 'admin' }
    end

    trait :with_posts do
      after(:create) do |user|
        create_list(:post, 3, user: user)
      end
    end
  end
end

# 使用
create(:user)
create(:user, :admin)
create(:user, :with_posts)
```

### Request Spec

```ruby
RSpec.describe 'Posts', type: :request do
  describe 'GET /api/v1/posts' do
    let!(:posts) { create_list(:post, 3) }

    it 'returns all posts' do
      get '/api/v1/posts'

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).size).to eq(3)
    end
  end

  describe 'POST /api/v1/posts' do
    let(:user) { create(:user) }
    let(:valid_params) { { post: { title: 'Test', body: 'Content' } } }

    before { sign_in user }

    it 'creates a new post' do
      expect {
        post '/api/v1/posts', params: valid_params
      }.to change(Post, :count).by(1)

      expect(response).to have_http_status(:created)
    end
  end
end
```

---

## 13. セキュリティ

### CSRF 対策

```ruby
class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception

  # API の場合
  # protect_from_forgery with: :null_session
end
```

### Strong Parameters

```ruby
class PostsController < ApplicationController
  def create
    @post = Post.new(post_params)
    # ...
  end

  private

  def post_params
    params.require(:post).permit(:title, :body, :published, tags: [])
  end
end
```

### SQL インジェクション対策

```ruby
# 悪い例
User.where("name = '#{params[:name]}'")

# 良い例
User.where(name: params[:name])
User.where('name = ?', params[:name])
User.where('name = :name', name: params[:name])
```

---

## 14. 設計パターン

### Service Object

```ruby
# app/services/user_registration_service.rb
class UserRegistrationService
  def initialize(params)
    @params = params
  end

  def call
    ActiveRecord::Base.transaction do
      user = create_user
      create_profile(user)
      send_welcome_email(user)
      user
    end
  rescue StandardError => e
    Rails.logger.error("Registration failed: #{e.message}")
    nil
  end

  private

  def create_user
    User.create!(@params.slice(:email, :password, :name))
  end

  def create_profile(user)
    user.create_profile!(@params.slice(:bio, :avatar))
  end

  def send_welcome_email(user)
    UserMailer.welcome(user).deliver_later
  end
end

# 使用
result = UserRegistrationService.new(params).call
```

### Form Object

```ruby
# app/forms/user_registration_form.rb
class UserRegistrationForm
  include ActiveModel::Model

  attr_accessor :email, :password, :password_confirmation, :name, :terms

  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, presence: true, length: { minimum: 8 }
  validates :password, confirmation: true
  validates :terms, acceptance: true

  def save
    return false unless valid?

    User.create(email: email, password: password, name: name)
  end
end
```

### Query Object

```ruby
# app/queries/recent_posts_query.rb
class RecentPostsQuery
  def initialize(relation = Post.all)
    @relation = relation
  end

  def call(limit: 10, published_only: true)
    result = @relation.order(created_at: :desc)
    result = result.where(published: true) if published_only
    result.limit(limit)
  end
end

# 使用
RecentPostsQuery.new(user.posts).call(limit: 5)
```

---

## 学習チェックリスト

### 基本

- [ ] MVC の役割を説明できる
- [ ] N+1 問題と解決策を説明できる
- [ ] スコープとクラスメソッドの違いを説明できる

### Active Record

- [ ] アソシエーションの種類と使い分けを説明できる
- [ ] コールバックのライフサイクルを説明できる
- [ ] バリデーションの種類を説明できる

### パフォーマンス

- [ ] クエリ最適化の手法を説明できる
- [ ] キャッシュ戦略を説明できる
- [ ] バッチ処理の方法を説明できる

### 設計

- [ ] Service Object を説明できる
- [ ] Form Object を説明できる
- [ ] Query Object を説明できる

---

## 関連ノート

- [[Interview-Database]]
- [[Interview-Backend-API]]
- [[Interview-Security]]
