# Terraform 学習ノート

## 概要

Terraform は HashiCorp が開発した Infrastructure as Code (IaC) ツール。クラウドリソースをコードで定義・管理できる。

## 基本概念

### IaC のメリット

- **バージョン管理**: インフラの変更履歴をGitで追跡
- **再現性**: 同じ環境を何度でも作成
- **レビュー**: PRでインフラ変更をレビュー
- **ドキュメント化**: コードが仕様書になる

## 基本構文 (HCL)

### プロバイダー設定

```hcl
# main.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "my-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "ap-northeast-1"
  }
}

provider "aws" {
  region = var.aws_region
}
```

### 変数

```hcl
# variables.tf
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "app_config" {
  description = "Application configuration"
  type = object({
    name        = string
    port        = number
    replicas    = number
  })
  default = {
    name     = "myapp"
    port     = 3000
    replicas = 2
  }
}
```

### リソース定義

```hcl
# vpc.tf
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.environment}-vpc"
    Environment = var.environment
  }
}

resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${var.environment}-public-${count.index + 1}"
  }
}
```

### データソース

```hcl
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}
```

### 出力

```hcl
# outputs.tf
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}
```

## Vercel + Terraform

```hcl
terraform {
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.0"
    }
  }
}

provider "vercel" {
  api_token = var.vercel_api_token
}

resource "vercel_project" "nextjs_app" {
  name      = "my-nextjs-app"
  framework = "nextjs"

  git_repository = {
    type = "github"
    repo = "myorg/my-nextjs-app"
  }

  environment = [
    {
      key    = "DATABASE_URL"
      value  = var.database_url
      target = ["production"]
    }
  ]
}

resource "vercel_project_domain" "custom_domain" {
  project_id = vercel_project.nextjs_app.id
  domain     = "myapp.example.com"
}
```

## コマンド

```bash
# 初期化
terraform init

# 計画確認
terraform plan

# 適用
terraform apply

# 破棄
terraform destroy

# フォーマット
terraform fmt

# 検証
terraform validate

# 状態確認
terraform state list
terraform state show aws_vpc.main
```

## モジュール

```hcl
# modules/vpc/main.tf
variable "cidr_block" {
  type = string
}

resource "aws_vpc" "this" {
  cidr_block = var.cidr_block
}

output "vpc_id" {
  value = aws_vpc.this.id
}

# main.tf で使用
module "vpc" {
  source     = "./modules/vpc"
  cidr_block = "10.0.0.0/16"
}
```

## ベストプラクティス

1. **リモートステート**: S3 + DynamoDB でロック
2. **モジュール化**: 再利用可能なモジュール
3. **環境分離**: workspace または別ディレクトリ
4. **機密情報**: Secrets Manager / SSM Parameter Store

## 参考リソース

- [Terraform 公式ドキュメント](https://developer.hashicorp.com/terraform/docs)
- [Vercel Terraform Provider](https://registry.terraform.io/providers/vercel/vercel/latest/docs)
