import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import headers from "../config/header.js";

export class HttpService {
  constructor(proxy = null) {
    this.axiosInstance = axios.create({
      baseURL: "https://www.binance.com/bapi/growth/v1/friendly/growth-paas/",
      timeout: 5000,
    });
    this.proxy = proxy;
  }

  initConfigIp(accessToken = undefined) {
    const config = {
      headers: { ...headers, "X-Growth-Token": accessToken },
    };
    if (this.proxy) {
      config["httpsAgent"] = new HttpsProxyAgent(this.proxy);
    }
    return config;
  }

  get(url, params = {}, accessToken) {
    const queryString = "?" + new URLSearchParams(params).toString();
    const config = this.initConfigIp(accessToken);
    const urlQuery = url + queryString;
    return this.axiosInstance.get(urlQuery, config);
  }

  post(url, body, params = {}, accessToken) {
    const queryString = "?" + new URLSearchParams(params).toString();
    const config = this.initConfigIp(accessToken);
    const urlQuery = url + queryString;
    return this.axiosInstance.post(urlQuery, body, config);
  }

  async checkIpProxy(user) {
    if (!this.proxy) {
      user.log.updateIp("🖥️");
      return null;
    }
    try {
      const proxyAgent = new HttpsProxyAgent(this.proxy);
      const response = await axios.get("https://api.ipify.org?format=json", {
        httpsAgent: proxyAgent,
      });
      if (response.status === 200) {
        const ip = response.data.ip;
        user.log.updateIp(ip);
        return ip;
      } else {
        throw new Error("Proxy lỗi, kiểm tra lại kết nối proxy");
      }
    } catch (error) {
      user.log.updateIp("🖥️");
      user.log.logError("Proxy lỗi, kiểm tra lại kết nối proxy");
      return -1;
    }
  }
}
