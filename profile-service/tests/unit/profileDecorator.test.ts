import { describe, it, expect } from '@jest/globals';
import {
  BaseProfileComponent,
  ProfileWithStatistics,
  ProfileWithBadges,
  type ProfileStatistics,
  type ProfileBadge,
} from '../../src/profiles/domain/entities/profileDecorator.js';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const BASE_DATA = {
  id: 'user-123',
  fullName: 'Ana García',
  email: 'ana@university.edu',
  career: 'Ingeniería de Software',
  semester: 5,
};

const STATS: ProfileStatistics = {
  createdGroupsCount: 3,
  joinedGroupsCount: 8,
  messagesSentCount: 142,
};

const BADGES: ProfileBadge[] = [
  {
    id: 'badge-001',
    name: 'First Connection',
    description: 'Made your first connection',
    icon: '🤝',
    unlockedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'badge-002',
    name: 'Group Leader',
    description: 'Created your first study group',
    icon: '👑',
    unlockedAt: '2024-02-20T12:00:00Z',
  },
];

// ─── BaseProfileComponent ────────────────────────────────────────────────────

describe('BaseProfileComponent', () => {
  it('retorna exactamente los datos base pasados al constructor', () => {
    const component = new BaseProfileComponent(BASE_DATA);
    const result = component.getProfileData();

    expect(result).toEqual(BASE_DATA);
  });

  it('no incluye la propiedad statistics en el resultado', () => {
    const component = new BaseProfileComponent(BASE_DATA);
    const result = component.getProfileData();

    expect(result).not.toHaveProperty('statistics');
  });

  it('no incluye la propiedad badges en el resultado', () => {
    const component = new BaseProfileComponent(BASE_DATA);
    const result = component.getProfileData();

    expect(result).not.toHaveProperty('badges');
  });

  it('funciona con un objeto de datos vacío', () => {
    const component = new BaseProfileComponent({});
    expect(component.getProfileData()).toEqual({});
  });
});

// ─── ProfileWithStatistics ───────────────────────────────────────────────────

describe('ProfileWithStatistics', () => {
  it('agrega la propiedad statistics al resultado', () => {
    const base = new BaseProfileComponent(BASE_DATA);
    const decorated = new ProfileWithStatistics(base, STATS);
    const result = decorated.getProfileData();

    expect(result).toHaveProperty('statistics');
    expect(result.statistics).toEqual(STATS);
  });

  it('conserva intactos todos los campos del perfil base', () => {
    const base = new BaseProfileComponent(BASE_DATA);
    const decorated = new ProfileWithStatistics(base, STATS);
    const result = decorated.getProfileData();

    expect(result.id).toBe(BASE_DATA.id);
    expect(result.fullName).toBe(BASE_DATA.fullName);
    expect(result.email).toBe(BASE_DATA.email);
    expect(result.career).toBe(BASE_DATA.career);
    expect(result.semester).toBe(BASE_DATA.semester);
  });

  it('los valores numéricos de statistics son correctos', () => {
    const base = new BaseProfileComponent(BASE_DATA);
    const decorated = new ProfileWithStatistics(base, STATS);
    const { statistics } = decorated.getProfileData();

    expect(statistics.createdGroupsCount).toBe(3);
    expect(statistics.joinedGroupsCount).toBe(8);
    expect(statistics.messagesSentCount).toBe(142);
  });

  it('no incluye la propiedad badges', () => {
    const base = new BaseProfileComponent(BASE_DATA);
    const decorated = new ProfileWithStatistics(base, STATS);
    const result = decorated.getProfileData();

    expect(result).not.toHaveProperty('badges');
  });
});

// ─── ProfileWithBadges ───────────────────────────────────────────────────────

describe('ProfileWithBadges', () => {
  it('agrega la propiedad badges al resultado', () => {
    const base = new BaseProfileComponent(BASE_DATA);
    const decorated = new ProfileWithBadges(base, BADGES);
    const result = decorated.getProfileData();

    expect(result).toHaveProperty('badges');
    expect(result.badges).toEqual(BADGES);
  });

  it('conserva intactos todos los campos del perfil base', () => {
    const base = new BaseProfileComponent(BASE_DATA);
    const decorated = new ProfileWithBadges(base, BADGES);
    const result = decorated.getProfileData();

    expect(result.id).toBe(BASE_DATA.id);
    expect(result.fullName).toBe(BASE_DATA.fullName);
    expect(result.email).toBe(BASE_DATA.email);
    expect(result.career).toBe(BASE_DATA.career);
    expect(result.semester).toBe(BASE_DATA.semester);
  });

  it('el array de badges tiene la longitud correcta y contiene los campos esperados', () => {
    const base = new BaseProfileComponent(BASE_DATA);
    const decorated = new ProfileWithBadges(base, BADGES);
    const { badges } = decorated.getProfileData();

    expect(badges).toHaveLength(2);
    expect(badges[0]).toMatchObject({ id: 'badge-001', name: 'First Connection' });
    expect(badges[1]).toMatchObject({ id: 'badge-002', name: 'Group Leader' });
  });

  it('no incluye la propiedad statistics', () => {
    const base = new BaseProfileComponent(BASE_DATA);
    const decorated = new ProfileWithBadges(base, BADGES);
    const result = decorated.getProfileData();

    expect(result).not.toHaveProperty('statistics');
  });

  it('prueba negativa: perfil sin badges devuelve array vacío cuando se pasa []', () => {
    const base = new BaseProfileComponent(BASE_DATA);
    const decorated = new ProfileWithBadges(base, []);
    const result = decorated.getProfileData();

    expect(result).toHaveProperty('badges');
    expect(result.badges).toEqual([]);
    expect(result.badges).toHaveLength(0);
  });
});

// ─── Composición de decoradores ───────────────────────────────────────────────

describe('Composición de decoradores (ProfileWithBadges + ProfileWithStatistics)', () => {
  it('retorna base + statistics + badges al componer ambos decoradores', () => {
    const base = new BaseProfileComponent(BASE_DATA);
    const withStats = new ProfileWithStatistics(base, STATS);
    const withBoth = new ProfileWithBadges(withStats, BADGES);
    const result = withBoth.getProfileData();

    // Datos base
    expect(result.id).toBe(BASE_DATA.id);
    expect(result.fullName).toBe(BASE_DATA.fullName);

    // Decorador interior (statistics)
    expect(result).toHaveProperty('statistics');
    expect(result.statistics).toEqual(STATS);

    // Decorador exterior (badges)
    expect(result).toHaveProperty('badges');
    expect(result.badges).toEqual(BADGES);
  });

  it('el decorador interior (statistics) no se pierde al añadir el exterior (badges)', () => {
    const base = new BaseProfileComponent(BASE_DATA);
    const withStats = new ProfileWithStatistics(base, STATS);
    const withBoth = new ProfileWithBadges(withStats, BADGES);

    const result = withBoth.getProfileData();

    expect(result.statistics.createdGroupsCount).toBe(STATS.createdGroupsCount);
    expect(result.statistics.joinedGroupsCount).toBe(STATS.joinedGroupsCount);
    expect(result.statistics.messagesSentCount).toBe(STATS.messagesSentCount);
  });

  it('la composición inversa (statistics sobre badges) también conserva ambas capas', () => {
    const base = new BaseProfileComponent(BASE_DATA);
    const withBadges = new ProfileWithBadges(base, BADGES);
    const withBoth = new ProfileWithStatistics(withBadges, STATS);
    const result = withBoth.getProfileData();

    expect(result).toHaveProperty('badges');
    expect(result).toHaveProperty('statistics');
    expect(result.badges).toEqual(BADGES);
    expect(result.statistics).toEqual(STATS);
  });

  it('prueba negativa: componente base sin statistics ni badges no los tiene en la composición base sola', () => {
    const base = new BaseProfileComponent(BASE_DATA);
    const result = base.getProfileData();

    expect(result).not.toHaveProperty('statistics');
    expect(result).not.toHaveProperty('badges');
    expect(Object.keys(result)).toEqual(Object.keys(BASE_DATA));
  });
});
