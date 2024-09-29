import colors from "colors";
import delayHelper from "./share/delay.js";
import datetimeHelper from "./share/datetime.js";
import authService from "./auth/index.js";
import gameService from "./game/index.js";

const DELAY_ACC = 5;

const run = async (user) => {
  const dataUser = user.dataUser;
  await delayHelper.delay((dataUser.index - 1) * DELAY_ACC);
  console.log(`========== Đăng nhập tài khoản ${dataUser.index} | ${dataUser.fullName.green} ==========`);
  while (true) {
    const ip = await dataUser.http.checkIpProxy(dataUser);
    if (ip === -1) {
      const seconds = 60 * 5;
      await delayHelper.delay(
        seconds,
        colors.yellow(`Thử kết nối lại proxy sau ${datetimeHelper.formatDuration(seconds)}`),
        dataUser.log
      );
      continue;
    }
    const result = await authService.getToken(dataUser);
    if (!result) {
      dataUser.log.logError(`Không lấy được thông tin user`);
    }
    const { userInfo, accessToken } = result;
    const totalGrade = userInfo.metaInfo.totalGrade;
    let totalAttempts = userInfo.metaInfo.totalAttempts;
    let consumedAttempts = userInfo.metaInfo.consumedAttempts;
    let availableTickets = totalAttempts - consumedAttempts;
    dataUser.log.log(`Tổng điểm ${colors.green(totalGrade)} 💰 - Vé đang có: ${colors.green(availableTickets)} 📌`);
    while (availableTickets > 0) {
      dataUser.log.log(`Bắt đầu game với ${availableTickets} vé có sẵn`);
      const gameResponse = await gameService.startGame(dataUser, accessToken);
      if (gameResponse) {
        const game = await gameService.getGameData(dataUser, gameResponse);
        if (game) {
          await delayHelper.delay(
            45,
            colors.yellow(`Chơi game xong sau ${datetimeHelper.formatDuration(45)}`),
            dataUser.log
          );
          if (await gameService.completeGame(dataUser, accessToken, game)) {
            availableTickets--;
            dataUser.log.log(`Vé còn lại: ${availableTickets}`);
          } else {
            break;
          }
        } else {
          dataUser.log.logSuccess("Không thể lấy dữ liệu trò chơi");
          break;
        }
      } else {
        dataUser.log.logSuccess("Không thể bắt đầu trò chơi");
        break;
      }

      if (availableTickets > 0) {
        const randomNumber = Math.floor(Math.random() * (4000 - 2000 + 1)) + 2000;
        await delayHelper.delay(randomNumber);
      }
    }

    const randomNumber = Math.floor(Math.random() * (60 - 20 + 1)) + 20;
    await delayHelper.delay(
      randomNumber * 60,
      colors.yellow(`Thực hiện chơi lần tiếp theo sau ${datetimeHelper.formatDuration(randomNumber * 60)}`),
      dataUser.log
    );
  }
};

console.log(colors.green.bold(`===============  Tool phát triển và chia sẻ miễn phí bởi Nhimcaptain  ===============`));
console.log("Nguyên cấm mọi hành vi buôn bán tool trái phép!");
console.log(`Cập nhật các tool mới nhất tại: ${colors.gray("https://github.com/nhimcaptin")}`);
console.log(`Telegram: ${colors.green("https://t.me/tran_danh_doanh")}`);
console.log("");
console.log("");
console.log("");
console.log("");

const users = authService.getUser();
users.forEach((__user) => {
  run(__user);
});
