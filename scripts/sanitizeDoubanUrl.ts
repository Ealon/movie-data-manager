import { PrismaClient } from "../next-app/generated/prisma";
const prisma = new PrismaClient();

const doubanUrlRegex = /\/subject\/\d+/;

async function sanitizeDoubanURL(): Promise<void> {
  try {
    const doubanEntries = await prisma.doubanInfo.findMany({
      select: { id: true, title: true, url: true },
    });
    for (const entry of doubanEntries) {
      const { id, url, title } = entry;
      if (doubanUrlRegex.test(url)) {
        // const sanitizedUrl = doubanUrlRegex.exec(url)?.[0];
        const sanitizedUrl = url.match(doubanUrlRegex)?.[0];
        if (sanitizedUrl) {
          await prisma.doubanInfo.update({
            where: { id },
            data: { url: sanitizedUrl },
          });
        }
      } else {
        console.log("\n\nInvalid URL: ", title, url, "\n\n");
      }
    }
  } catch (err: any) {
    console.error(err);
  }
}

sanitizeDoubanURL();

// 我来分析一下这两行代码的区别。首先让我查看完整的文件内容来了解上下文。

// Read file: scripts/sanitizeDoubanUrl.ts
// 现在我可以解释这两行代码的区别了：

// ```typescript
// const sanitizedUrl = doubanUrlRegex.exec(url)?.[0];
// const sanitizedUrl = url.match(doubanUrlRegex)?.[0];
// ```

// **这两行代码的结果是一样的**，但有一些重要的区别：

// ## 功能上的相似性
// - 两者都会返回匹配的字符串（`/subject/123456`）
// - 如果URL不匹配正则表达式，两者都返回 `undefined`

// ## 主要区别

// ### 1. **调用方式不同**
// - `doubanUrlRegex.exec(url)` - 在正则表达式对象上调用 `exec()` 方法
// - `url.match(doubanUrlRegex)` - 在字符串上调用 `match()` 方法

// ### 2. **正则表达式的状态影响**
// - `exec()` 方法会**修改正则表达式的状态**（lastIndex 属性）
// - `match()` 方法**不会修改**正则表达式的状态

// ### 3. **性能考虑**
// - 如果这个正则表达式会被重复使用，`exec()` 可能会因为状态变化而产生意外结果
// - `match()` 更安全，因为它不会改变正则表达式的状态

// ## 在你的代码中
// 由于 `doubanUrlRegex` 是一个简单的正则表达式 `/\/subject\/\d+/`，并且每次循环都会重新测试，所以在这个特定场景下，两种方法的结果完全相同。

// ## 建议
// 推荐使用 `url.match(doubanUrlRegex)?.[0]`，因为：
// 1. 更直观易读
// 2. 不会修改正则表达式状态
// 3. 更符合现代 JavaScript 的写法

// 另外，你的代码中有重复的变量声明，应该删除其中一行。
