#!/bin/bash

# 数据库同步脚本
# 使用方法: ./sync-db.sh [pull|push] [prod|local]

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置
PROD_DB_URL="postgresql://user:password@prod-host:5432/dbname"
LOCAL_DB_URL="postgresql://user:password@localhost:5432/dbname"
ENV_FILE=".env"

# 函数：打印带颜色的消息
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 函数：备份当前 .env 文件
backup_env() {
    if [ -f "$ENV_FILE" ]; then
        cp "$ENV_FILE" "${ENV_FILE}.backup"
        print_message "Backed up $ENV_FILE to ${ENV_FILE}.backup"
    fi
}

# 函数：恢复 .env 文件
restore_env() {
    if [ -f "${ENV_FILE}.backup" ]; then
        mv "${ENV_FILE}.backup" "$ENV_FILE"
        print_message "Restored $ENV_FILE from backup"
    fi
}

# 函数：从线上拉取数据到本地
pull_from_prod() {
    print_message "Pulling schema from production database..."

    # 备份当前 .env
    backup_env

    # 临时设置生产数据库 URL
    echo "DATABASE_URL=\"$PROD_DB_URL\"" > "$ENV_FILE"

    # 拉取 schema
    npx prisma db pull

    # 生成 client
    npx prisma generate

    # 恢复本地数据库 URL
    echo "DATABASE_URL=\"$LOCAL_DB_URL\"" > "$ENV_FILE"

    print_message "Schema pulled successfully from production"
}

# 函数：推送本地数据到线上
push_to_prod() {
    print_warning "This will overwrite production database schema!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_message "Pushing schema to production database..."

        # 备份当前 .env
        backup_env

        # 临时设置生产数据库 URL
        echo "DATABASE_URL=\"$PROD_DB_URL\"" > "$ENV_FILE"

        # 推送 schema
        npx prisma db push --accept-data-loss

        # 生成 client
        npx prisma generate

        # 恢复本地数据库 URL
        echo "DATABASE_URL=\"$LOCAL_DB_URL\"" > "$ENV_FILE"

        print_message "Schema pushed successfully to production"
    else
        print_message "Operation cancelled"
    fi
}

# 函数：显示帮助信息
show_help() {
    echo "Usage: $0 [pull|push] [prod|local]"
    echo ""
    echo "Commands:"
    echo "  pull prod   - Pull schema from production to local"
    echo "  push prod   - Push local schema to production"
    echo "  help        - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 pull prod  # Pull from production to local"
    echo "  $0 push prod  # Push from local to production"
}

# 主逻辑
case "$1" in
    "pull")
        case "$2" in
            "prod")
                pull_from_prod
                ;;
            *)
                print_error "Invalid target. Use 'prod' for production database"
                show_help
                exit 1
                ;;
        esac
        ;;
    "push")
        case "$2" in
            "prod")
                push_to_prod
                ;;
            *)
                print_error "Invalid target. Use 'prod' for production database"
                show_help
                exit 1
                ;;
        esac
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    *)
        print_error "Invalid command"
        show_help
        exit 1
        ;;
esac
