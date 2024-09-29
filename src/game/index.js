import crypto from "crypto";
import colors from "colors";

class GameService {
  async startGame(user, accessToken) {
    try {
      const response = await user.http.post(
        "mini-app-activity/third-party/game/start",
        { resourceId: 2056 },
        null,
        accessToken
      );

      if (response.data.code === "000000") {
        user.log.logSuccess("Bắt đầu game thành công");
        return response.data;
      }

      if (response.data.code === "116002") {
        user.log.logError("Không đủ lượt chơi!");
      } else {
        user.log.logError("Lỗi khi bắt đầu game!");
      }

      return false;
    } catch (error) {
      user.log.logError(`Không thể bắt đầu game: ${error.message}`);
      return false;
    }
  }

  async getGameData(user, gameResponse) {
    try {
      const startTime = Date.now();
      const endTime = startTime + 45000;
      const gameTag = gameResponse.data.gameTag;
      const itemSettings = gameResponse.data.cryptoMinerConfig.itemSettingList;

      let currentTime = startTime;
      let points = 0;
      let count = 0;
      let countMissedPull = 0;
      const gameEvents = [];

      (itemSettings || []).push({
        type: undefined,
        speed: undefined,
        size: undefined,
        quantity: undefined,
        rewardValueList: [undefined, undefined, undefined, undefined, undefined],
      });

      const _data = itemSettings
        .map((item, index) => {
          return item.rewardValueList.map((_item, _index) => {
            return {
              index: index + _index,
              id: Math.floor(Math.random() * 1000) + 1000,
              type: this.isCheckType(item.type),
              speed: item.speed,
              size: item.size,
              point: _item,
            };
          });
        })
        .flat()
        .sort((a, b) => a.id - b.id);

      while (currentTime < endTime) {
        const randomValue = Math.random();
        let timeIncrement = Math.floor(Math.random() * (2500 - 1500 + 1)) + 1500;
        if (_data[count]?.speed && [70, 80].includes(_data[count]?.speed)) {
          timeIncrement = Math.floor(Math.random() * (5000 - 2500 + 1)) + 2500;
        }
        if (_data[count]?.speed && [150, 100].includes(_data[count]?.speed)) {
          timeIncrement = Math.floor(Math.random() * (3500 - 2000 + 1)) + 2000;
        }
        if (randomValue > 0.85) {
          timeIncrement = Math.floor(Math.random() * (7000 - 4000 + 1)) + 4000;
        }
        currentTime += timeIncrement;
        if (currentTime > endTime) break;
        if (_data[count]?.speed) {
          let itemType, itemSize;
          const hookPosX = (Math.random() * (275 - 75) + 75).toFixed(3);
          const hookPosY = (Math.random() * (251 - 199) + 199).toFixed(3);
          const hookShotAngle = (Math.random() * 2 - 1).toFixed(3);
          const hookHitX = (Math.random() * (400 - 100) + 100).toFixed(3);
          const hookHitY = (Math.random() * (700 - 250) + 250).toFixed(3);

          if (points + _data[count]?.point <= 230) {
            points = Math.max(points + _data[count]?.point || 0, 0);
          }
          itemType = _data[count]?.type;
          itemSize = _data[count]?.size;
          const eventData = `${currentTime}|${hookPosX}|${hookPosY}|${hookShotAngle}|${hookHitX}|${hookHitY}|${itemType}|${itemSize}|${_data[count]?.point}`;
          gameEvents.push(eventData);
        } else {
          countMissedPull++;
        }
        count++;
      }
      const payload = gameEvents.join(";");
      const encryptedPayload = this.encrypt(payload, gameTag);
      return {
        payload: encryptedPayload,
        log: points,
        count,
        countMissedPull,
      };
    } catch (error) {
      user.log.logError(`Error in getGameData: ${error.message}`);
      return false;
    }
  }

  async completeGame(user, accessToken, game) {
    const stringPayload = game.payload;
    const payload = {
      resourceId: 2056,
      payload: stringPayload,
      log: game.log,
    };
    try {
      const response = await user.http.post("mini-app-activity/third-party/game/complete", payload, null, accessToken);
      const data = response.data;
      if (data.success) {
        user.log.logSuccess(
          `Hoàn thành game thành công | Kéo : ${colors.yellow(game.count)} | Hụt: ${colors.red(
            game.countMissedPull
          )} | Nhận được ${colors.magenta(game.log)} 💰`
        );
        return true;
      } else {
        user.log.logError(`Failed to complete game: ${JSON.stringify(data)}`);
        return false;
      }
    } catch (error) {
      user.log.logError(`Error completing game: ${error.message}`);
      return false;
    }
  }

  isCheckType(type) {
    let typeNumber = 0;
    switch (type) {
      case "REWARD":
      case "TRAP":
        typeNumber = 1;
        break;
      case "BONUS":
        typeNumber = 2;
        break;
    }
    return typeNumber;
  }

  encrypt(text, key) {
    const iv = crypto.randomBytes(12);
    const ivBase64 = iv.toString("base64");
    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(key), ivBase64.slice(0, 16));
    let encrypted = cipher.update(text, "utf8", "base64");
    encrypted += cipher.final("base64");
    return ivBase64 + encrypted;
  }
}

const gameService = new GameService();
export default gameService;
