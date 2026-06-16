export interface IProfileComponent {
  getProfileData(): any;
}

export class BaseProfileComponent implements IProfileComponent {
  constructor(private readonly data: any) {}

  getProfileData(): any {
    return this.data;
  }
}

export abstract class ProfileDecorator implements IProfileComponent {
  constructor(protected readonly component: IProfileComponent) {}

  abstract getProfileData(): any;
}

export interface ProfileStatistics {
  createdGroupsCount: number;
  joinedGroupsCount: number;
  messagesSentCount: number;
}

export class ProfileWithStatistics extends ProfileDecorator {
  constructor(component: IProfileComponent, private readonly stats: ProfileStatistics) {
    super(component);
  }

  getProfileData(): any {
    const data = this.component.getProfileData();
    return {
      ...data,
      statistics: this.stats,
    };
  }
}

export interface ProfileBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string;
}

export class ProfileWithBadges extends ProfileDecorator {
  constructor(component: IProfileComponent, private readonly badges: ProfileBadge[]) {
    super(component);
  }

  getProfileData(): any {
    const data = this.component.getProfileData();
    return {
      ...data,
      badges: this.badges,
    };
  }
}
