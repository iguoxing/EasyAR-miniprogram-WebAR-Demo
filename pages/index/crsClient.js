export class CrsClient {
    /**
     * @param config { {cloudKey: string, token: string, clientHost: string, jpegQuality: number} }
     * @param canvas { HTMLCanvasElement }
     */
    constructor(config, canvas) {
        this.config = config;
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
    }

    /**
     * 发起一次CRS请求
     * @param frame { {data: ArrayBuffer, height: number, width: number} } 相机帧
     * @return {Promise}
     */
    queryImage(frame) {
        /*
         * 从相机帧开始，发起一次CRS请求的步骤：
         * 1. 将相机帧画到canvas上
         * 2. 调用canvas.toDataURL得到JPEG图片的base64 (需要小程序基础库2.12.0及以上)
         * 3. 填充请求参数
         * 4. 发送CRS请求并返回
         */
        let ctxImageData = this.context.createImageData(frame.width, frame.height); //#1
        ctxImageData.data.set(new Uint8ClampedArray(frame.data)); //#1
        this.context.putImageData(ctxImageData, 0, 0); //#1
        let dataUrl = this.canvas.toDataURL("image/jpeg", this.config.quality); //#2
        let base64 = dataUrl.substr(23); //#2 去除dataURL头，留下文件内容

        const params = { //#3 添加cloudKey参数
            image: base64,
            notracking: "true",
            appId: this.config.cloudKey,
        };

        return new Promise((resolve, reject) => { //#4 发送CRS请求
            wx.request({
                url: `${this.config.clientHost}/search/`,
                method: 'post',
                data: params,
                header: {
                    'Authorization': this.config.token,
                    'content-type': 'application/json'
                },
                success: res => resolve(res.data),
                fail: err => reject(err),
            });
        });
    }
}
