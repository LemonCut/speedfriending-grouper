import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

const HEADER = ['id', 'firstName', 'lastName', 'timestamp'];
const ROLES = ['bit', 'byte'];

function fail(message, code) {
  const err = new Error(message);
  err.code = code;
  return err;
}

/**
 * File-backed store. bits.csv / bytes.csv hold registrations;
 * groups.json existing means intake is locked.
 */
export class Store {
  constructor(dataDir) {
    this.dataDir = dataDir;
    fs.mkdirSync(dataDir, { recursive: true });
    for (const role of ROLES) {
      if (!fs.existsSync(this.#file(role))) fs.writeFileSync(this.#file(role), stringify([HEADER]));
    }
  }

  #file(role) {
    return path.join(this.dataDir, role === 'bit' ? 'bits.csv' : 'bytes.csv');
  }

  get #groupsFile() {
    return path.join(this.dataDir, 'groups.json');
  }

  list(role) {
    return parse(fs.readFileSync(this.#file(role), 'utf8'), { columns: true, skip_empty_lines: true });
  }

  add({ firstName, lastName, name, role }) {
    if (this.isLocked()) throw fail('Registration is closed — groups have been set.', 'LOCKED');
    if (name !== undefined) {
      name = String(name ?? '').trim().replace(/\s+/g, ' ');
      if (!name) throw fail('Please enter your name.', 'INVALID');
      if (name.length > 80) throw fail('Name must be 80 characters or fewer.', 'INVALID');
      const idx = name.indexOf(' ');
      if (idx > -1) {
        firstName = name.slice(0, idx);
        lastName = name.slice(idx + 1);
      } else {
        firstName = name;
        lastName = '';
      }
    } else {
      firstName = String(firstName ?? '').trim().replace(/\s+/g, ' ');
      lastName = String(lastName ?? '').trim().replace(/\s+/g, ' ');
      if (!firstName || !lastName) throw fail('Please enter your first and last name.', 'INVALID');
      if (firstName.length > 40 || lastName.length > 40) throw fail('Names must be 40 characters or fewer.', 'INVALID');
    }
    if (!ROLES.includes(role)) throw fail('Please choose Bit or Byte.', 'INVALID');

    const displayName = [firstName, lastName].filter(Boolean).join(' ');
    const key = displayName.toLowerCase();
    const exists = ROLES.some((r) =>
      this.list(r).some((p) => [p.firstName, p.lastName].filter(Boolean).join(' ').toLowerCase() === key),
    );
    if (exists) throw fail(`${displayName} is already registered.`, 'DUPLICATE');

    const rec = { id: crypto.randomUUID(), firstName, lastName, timestamp: new Date().toISOString() };
    fs.appendFileSync(this.#file(role), stringify([HEADER.map((h) => rec[h])]));
    return { ...rec, name: displayName, role };
  }

  isLocked() {
    return fs.existsSync(this.#groupsFile);
  }

  getGroups() {
    return this.isLocked() ? JSON.parse(fs.readFileSync(this.#groupsFile, 'utf8')) : null;
  }

  saveGroups(result) {
    const data = { ...result, createdAt: new Date().toISOString() };
    fs.writeFileSync(this.#groupsFile, JSON.stringify(data, null, 2));
    return data;
  }

  unlock() {
    fs.rmSync(this.#groupsFile, { force: true });
  }
}
