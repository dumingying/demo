

const exec = require('child_process').exec
const iconv = require('iconv-lite')
const isOsx = process.platform === "darwin";
const isWin = !isOsx;
function pingHost(host) {
    let pingValue = ''
    let ping = null
    if (isWin) {
        ping = exec(`ping -n 5 ${host}`, { encoding: 'binary' },
            (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`)
                    return
                }
                if (stdout) {
                    pingValue = iconv.decode(stdout, 'cp936')
                }
                if (stderr) {
                    console.error('stderr:', stderr)
                }
            })
    } else {
        ping = exec(
            `ping -c 5 ${host}`,
            { encoding: 'binary' },
            (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`)
                    return
                }
                if (stdout) {
                    pingValue = iconv.decode(stdout, 'cp936')
                }
                if (stderr) {
                    console.error('stderr:', stderr)
                }
            }
        )
    }
    iconv.skipDecodeWarning = true // 去掉提示打印
    ping.on('close', () => {
        setWifiInfo(pingValue, host)
    })
}
function setWifiInfo(pingValue, host) {
    let loss = '0%'
    let delay = 0
    try {
        if (pingValue) {
            if (process.platform !== 'darwin') {
                let winValue = pingValue.replace(/\s*/g, '').split('，')
                let lostStr = ''
                let delayStr = ''
                for (let i = 0;i < winValue.length;i++) {
                    if (winValue[i].indexOf('丢失') > -1) {
                        lostStr = winValue[i]
                        break
                    }
                }
                for (let i = 0;i < winValue.length;i++) {
                    if (winValue[i].indexOf('平均') > -1) {
                        delayStr = winValue[i]
                        break
                    }
                }
                if (lostStr) {
                    loss = lostStr
                        .match(/\((.+?)\)/g)[0]
                        .replace('(', '')
                        .replace(')', '')
                        .replace('丢失', '')
                }
                if (delayStr) {
                    delay = delayStr.split('=')[1].replace('ms', '')
                }
            } else {
                let newValue = pingValue.replace(/\s*/g, '')
                let packetValueArr = newValue.split(',')
                let delayValueArr = newValue.split('=')
                let packetValue = ''
                for (let i = 0;i < packetValueArr.length;i++) {
                    if (packetValueArr[i].toLowerCase().indexOf('packetloss') > -1) {
                        packetValue = packetValueArr[i]
                        break
                    }
                }
                if (packetValue) {
                    loss = packetValue.slice(0, packetValue.indexOf('packetloss'))
                }
                if (delayValueArr && delayValueArr.length) {
                    delay = delayValueArr[delayValueArr.length - 1].split('/')[1]
                }
            }
        }
        process.send({ loss, delay })
        host === 'baidu.com' && pingHost(host)
    } catch (error) {
        console.log(error)
        process.send({ loss, delay })
    }
}
process.on('message', (data) => {
    pingHost(data)
})

