# 数据库同步脚本

这个目录包含了用于同步本地和线上数据库的脚本。

## 快速开始

### 1. 设置环境变量

在 `scripts` 目录下创建 `.env` 文件：

```bash
# 生产环境数据库 URL
PROD_DATABASE_URL="postgresql://user:password@prod-host:5432/dbname"

# 本地数据库 URL
LOCAL_DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
```

### 2. 使用 npm/yarn 脚本

```bash
# 从线上拉取 schema 到本地
yarn sync:pull

# 推送本地 schema 到线上
yarn sync:push
```

### 3. 直接使用 TypeScript 脚本

```bash
# 从线上拉取 schema 到本地
tsx sync-db.ts pull prod

# 推送本地 schema 到线上
tsx sync-db.ts push prod

# 显示帮助信息
tsx sync-db.ts help
```

## 脚本功能

### `sync-db.ts` - TypeScript 版本（推荐）

- ✅ 自动备份和恢复 `.env` 文件
- ✅ 彩色输出和错误处理
- ✅ 安全确认提示
- ✅ 环境变量支持

### `sync-db.sh` - Bash 版本

- ✅ 跨平台兼容
- ✅ 彩色输出
- ✅ 安全确认提示

## 工作流程

### 从线上同步到本地

1. **拉取线上 schema**：
   ```bash
   yarn sync:pull
   ```

2. **验证本地数据库**：
   ```bash
   npx prisma db push
   ```

3. **生成 Prisma client**：
   ```bash
   npx prisma generate
   ```

### 从本地同步到线上

1. **确认本地 schema 正确**：
   ```bash
   npx prisma validate
   ```

2. **推送到线上**：
   ```bash
   yarn sync:push
   ```

## 安全注意事项

⚠️ **重要提醒**：

- 推送操作会覆盖线上数据库的 schema
- 建议在推送前先备份线上数据库
- 确保本地 schema 已经过充分测试
- 使用 `--accept-data-loss` 标志时要特别小心

## 故障排除

### 常见问题

1. **连接失败**：
   - 检查数据库 URL 是否正确
   - 确认网络连接和防火墙设置
   - 验证数据库用户权限

2. **权限错误**：
   - 确保数据库用户有足够的权限
   - 检查数据库是否允许外部连接

3. **Schema 冲突**：
   - 使用 `npx prisma db pull` 查看线上 schema
   - 手动解决冲突后再推送

### 调试模式

```bash
# 启用详细输出
DEBUG=* tsx sync-db.ts pull prod

# 只查看 schema 不执行操作
npx prisma db pull --print
```

## 最佳实践

1. **开发环境**：
   - 使用 `prisma db push` 进行快速迭代
   - 定期从线上拉取最新 schema

2. **生产环境**：
   - 使用 `prisma migrate deploy` 进行安全部署
   - 在推送前进行充分测试

3. **团队协作**：
   - 使用版本控制管理 schema 变更
   - 建立代码审查流程
   - 记录所有数据库变更

## 相关命令

```bash
# Prisma 相关
npx prisma db pull          # 从数据库拉取 schema
npx prisma db push          # 推送 schema 到数据库
npx prisma generate         # 生成 Prisma client
npx prisma validate         # 验证 schema
npx prisma migrate dev      # 创建和应用迁移
npx prisma migrate deploy   # 部署迁移到生产环境

# 数据库管理
npx prisma studio           # 打开数据库管理界面
npx prisma db seed          # 运行数据库种子脚本
```
