export class UserService {
  constructor(dataUser) {
    this.dataUser = dataUser;
  }

  getUserData() {
    return this.dataUser;
  }
}
