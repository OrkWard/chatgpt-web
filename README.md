## 前置要求

### Node

`node` 需要 `^16 || ^18 || ^19` 版本（`node >= 14` 需要安装 [fetch polyfill](https://github.com/developit/unfetch#usage-as-a-polyfill)），使用 [nvm](https://github.com/nvm-sh/nvm) 可管理本地多个 `node` 版本

```shell
node -v
```

### PNPM
如果你没有安装过 `pnpm`
```shell
npm install pnpm -g
```

## 安装依赖
### 前端
根目录下运行以下命令
```shell
pnpm bootstrap
```

### 运行地址
http://localhost:1002/

### 后端
前端会将 http://localhost:1002/api/* 的请求 转发到 http://localhost:3002/*


## License
MIT © [ChenZhaoYu](./license)
