import { listPublicBaseSettings } from './system.repository.js';

export async function getBaseInfoService() {
  const settings = await listPublicBaseSettings();
  const entries = settings.map((setting) => [setting.key.replace(/^base\./, ''), setting.value]);
  return {
    ...Object.fromEntries(entries),
    settings,
  };
}
