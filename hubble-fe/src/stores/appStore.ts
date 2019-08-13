import { createContext } from 'react';
import { observable, action } from 'mobx';

export class AppStore {
  @observable user: string = 'Hi, User name';
  @observable currentTab: string = 'graph-management';

  @action.bound
  switchCurrentTab(tab: string) {
    this.currentTab = tab;
  }

  @action.bound
  setUser(user: string) {
    this.user = user;
  }
}

export default createContext(new AppStore());
