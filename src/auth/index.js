import { parse } from "querystring";
import { HttpService } from "../service/httpService.js";
import fileHelper from "../share/file.js";
import { LogHelper } from "../share/log.js";
import { UserService } from "../share/user.js";

class AuthService {
  getUser() {
    const rawUser = fileHelper.readFile("data.txt");
    const rawProxies = fileHelper.readFile("proxy.txt");
    const listUsers = rawUser
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    const listproxies = rawProxies
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (listUsers.length <= 0) {
      console.log("Không tìm thấy data user");
      return [];
    } else {
      const informationUser = listUsers.map((queryLine, index) => {
        const inforParse = parse(decodeURIComponent(queryLine));
        const user = JSON.parse(inforParse.user);
        const dataUser = {
          ...inforParse,
          user,
          fullName: (user.first_name + " " + user.last_name).trim(),
          raw: decodeURIComponent(queryLine),
          index: index + 1,
          proxy: listproxies[index] || null,
          http: new HttpService(listproxies[index] || null),
          log: new LogHelper(index + 1, user.id),
        };
        return new UserService(dataUser);
      });
      return informationUser;
    }
  }

  async getToken(dataUser) {
    const accessTokenUrl = "third-party/access/accessToken";
    const userInfoUrl = "mini-app-activity/third-party/user/user-info";
    const queryString = dataUser?.raw;
    try {
      const accessTokenResponse = await dataUser.http.post(accessTokenUrl, {
        queryString: queryString,
        socialType: "telegram",
      });
      if (accessTokenResponse.data.code !== "000000" || !accessTokenResponse.data.success) {
        throw new Error(`Failed to get access token: ${accessTokenResponse.data.message}`);
      }
      const accessToken = accessTokenResponse.data.data.accessToken;
      const userInfoResponse = await dataUser.http.post(
        userInfoUrl,
        {
          resourceId: 2056,
        },
        null,
        accessToken
      );

      if (userInfoResponse.data.code !== "000000" || !userInfoResponse.data.success) {
        throw new Error(`Failed to get user info: ${userInfoResponse.data.message}`);
      }

      return { userInfo: userInfoResponse.data.data, accessToken };
    } catch (error) {
      dataUser.log.logError(`API call failed: ${error.message}`);
      return null;
    }
  }
}

const authService = new AuthService();
export default authService;
