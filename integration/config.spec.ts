import { ProjectConfigService } from '../../andb-core/src/modules/config/project-config.service';
import { ConnectionType } from '../../andb-core/src/common/interfaces/connection.interface';

describe('ProjectConfigService', () => {
  let config: ProjectConfigService;

  beforeEach(() => {
    config = new ProjectConfigService();
  });

  it('should manage connections', () => {
    const conn = { host: 'localhost', user: 'root', database: 'test', type: ConnectionType.MYSQL };
    config.setConnection('DEV', conn, ConnectionType.MYSQL);

    const retrieved = config.getConnection('DEV');
    expect(retrieved.config.host).toBe('localhost');
    expect(retrieved.type).toBe('mysql');
  });

  it('should handle auto-backup setting', () => {
    config.setAutoBackup(true);
    expect(config.getAutoBackup()).toBe(true);

    config.setAutoBackup(false);
    expect(config.getAutoBackup()).toBe(false);
  });

  it('should manage domain normalization', () => {
    const pattern = /old-domain\.com/g;
    const replacement = 'new-domain.com';
    config.setDomainNormalization(pattern, replacement);

    const norm = config.getDomainNormalization();
    expect(norm.pattern).toEqual(pattern);
    expect(norm.replacement).toBe(replacement);
  });
});
