// License Service — Web build (localStorage แทน chrome.storage.local)
// Logic เดิมจาก extension license-service.js

(function () {
  const webLicenseStorage = {
    prefix: '1click_web_',
    async get(keys) {
      const keyArr = Array.isArray(keys) ? keys : Object.keys(keys || {});
      const out = {};
      for (const key of keyArr) {
        const raw = localStorage.getItem(this.prefix + key);
        if (raw === null) continue;
        try {
          out[key] = JSON.parse(raw);
        } catch {
          out[key] = raw;
        }
      }
      return out;
    },
    async set(obj) {
      for (const [k, v] of Object.entries(obj)) {
        localStorage.setItem(this.prefix + k, JSON.stringify(v));
      }
    },
    async remove(keys) {
      const arr = Array.isArray(keys) ? keys : [keys];
      for (const k of arr) {
        localStorage.removeItem(this.prefix + k);
      }
    }
  };

  class LicenseService {
    constructor() {
      this.isLicensed = false;
      this.licenseData = null;
      this.deviceId = null;
      this.maxDevices = 4;
      this._hs = [0x4c,0x69,0x63,0x5f,0x53,0x31,0x67,0x6e,0x5f,0x4b,0x33,0x79,0x5f,0x32,0x30,0x32,0x36].map(c => String.fromCharCode(c)).join('');
    }

    _sign(licenseKey, deviceId) {
      const data = licenseKey + '|' + deviceId + '|' + this._hs;
      let hash = 0x811c9dc5;
      for (let i = 0; i < data.length; i++) {
        hash ^= data.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
      }
      return (hash >>> 0).toString(36);
    }

    _verify(licenseKey, deviceId, signature) {
      return this._sign(licenseKey, deviceId) === signature;
    }

    async getDeviceId() {
      if (this.deviceId) return this.deviceId;
      try {
        const result = await webLicenseStorage.get(['deviceId']);
        if (result.deviceId) {
          this.deviceId = result.deviceId;
        } else {
          this.deviceId = 'web_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11);
          await webLicenseStorage.set({ deviceId: this.deviceId });
        }
        return this.deviceId;
      } catch (e) {
        console.error('[License] Error getting device ID:', e);
        return 'unknown_device';
      }
    }

    async validateLicense(licenseKey) {
      if (!licenseKey || licenseKey.trim() === '') {
        return { success: false, error: 'กรุณาใส่ License Key' };
      }
      const deviceId = await this.getDeviceId();
      const cleanKey = licenseKey.trim().toUpperCase();
      try {
        const response = await fetch(`${FIREBASE_DB_URL}/licenses/${cleanKey}.json`);
        if (!response.ok) {
          return { success: false, error: 'ไม่สามารถเชื่อมต่อ Server ได้' };
        }
        const licenseData = await response.json();
        if (!licenseData) {
          return { success: false, error: 'License Key ไม่ถูกต้อง' };
        }
        if (licenseData.expiresAt && new Date(licenseData.expiresAt) < new Date()) {
          return { success: false, error: 'License Key หมดอายุแล้ว' };
        }
        if (licenseData.disabled) {
          return { success: false, error: 'License Key ถูกระงับการใช้งาน' };
        }
        const devices = licenseData.devices || {};
        const deviceIds = Object.keys(devices);
        if (devices[deviceId]) {
          await this.updateDeviceLastSeen(cleanKey, deviceId);
          this.isLicensed = true;
          this.licenseData = licenseData;
          await this.saveLicenseLocal(cleanKey, licenseData);
          return {
            success: true,
            message: 'ยินดีต้อนรับกลับ!',
            devicesUsed: deviceIds.length,
            maxDevices: this.maxDevices
          };
        }
        if (deviceIds.length >= this.maxDevices) {
          return {
            success: false,
            error: `License Key นี้ใช้งานครบ ${this.maxDevices} โปรไฟล์แล้ว`,
            devicesUsed: deviceIds.length,
            maxDevices: this.maxDevices
          };
        }
        await this.registerDevice(cleanKey, deviceId);
        this.isLicensed = true;
        this.licenseData = licenseData;
        await this.saveLicenseLocal(cleanKey, licenseData);
        return {
          success: true,
          message: `ลงทะเบียนสำเร็จ! (${deviceIds.length + 1}/${this.maxDevices} โปรไฟล์)`,
          devicesUsed: deviceIds.length + 1,
          maxDevices: this.maxDevices
        };
      } catch (e) {
        console.error('[License] Validation error:', e);
        return { success: false, error: 'เกิดข้อผิดพลาด: ' + e.message };
      }
    }

    async registerDevice(licenseKey, deviceId) {
      const deviceData = {
        registeredAt: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        userAgent: navigator.userAgent.substring(0, 100)
      };
      const resp = await fetch(`${FIREBASE_DB_URL}/licenses/${licenseKey}/devices/${deviceId}.json`, {
        method: 'PUT',
        body: JSON.stringify(deviceData)
      });
      if (!resp.ok) throw new Error(`Register device failed: HTTP ${resp.status}`);
    }

    async updateDeviceLastSeen(licenseKey, deviceId) {
      const resp = await fetch(`${FIREBASE_DB_URL}/licenses/${licenseKey}/devices/${deviceId}/lastSeen.json`, {
        method: 'PUT',
        body: JSON.stringify(new Date().toISOString())
      });
      if (!resp.ok) console.warn('[License] updateDeviceLastSeen HTTP', resp.status);
    }

    async saveLicenseLocal(licenseKey, licenseData) {
      const deviceId = await this.getDeviceId();
      const sig = this._sign(licenseKey, deviceId);
      await webLicenseStorage.set({
        licenseKey,
        licenseData,
        licensedAt: new Date().toISOString(),
        deviceId,
        _ls: sig
      });
      console.log('[License] Saved license (web) deviceId:', deviceId);
    }

    async loadLocalLicense() {
      try {
        const result = await webLicenseStorage.get(['licenseKey', 'licenseData', 'licensedAt', 'deviceId', '_ls']);
        console.log('[License] Loading local license:', result.licenseKey ? 'Found' : 'Not found');
        if (result.licenseKey) {
          if (result.deviceId) {
            this.deviceId = result.deviceId;
          } else {
            this.deviceId = await this.getDeviceId();
            await webLicenseStorage.set({ deviceId: this.deviceId });
          }
          if (!result._ls || !this._verify(result.licenseKey, this.deviceId, result._ls)) {
            console.log('[License] Signature mismatch');
            await this.logout();
            return { success: false, error: 'License ไม่ถูกต้อง กรุณาลงทะเบียนใหม่' };
          }
          try {
            const serverValid = await this.backgroundValidate(result.licenseKey);
            if (serverValid === false) {
              return { success: false, error: 'License ถูกระงับหรือหมดอายุ' };
            }
          } catch (e) {
            console.log('[License] Server unreachable, using signed cache');
          }
          this.isLicensed = true;
          this.licenseData = result.licenseData;
          return { success: true, message: 'ยินดีต้อนรับกลับ!', fromCache: true };
        }
        return { success: false, error: 'ยังไม่ได้ลงทะเบียน License' };
      } catch (e) {
        console.error('[License] Load local error:', e);
        return { success: false, error: 'เกิดข้อผิดพลาด' };
      }
    }

    async backgroundValidate(licenseKey) {
      const response = await fetch(`${FIREBASE_DB_URL}/licenses/${licenseKey}.json`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const licenseData = await response.json();
      if (!licenseData || licenseData.disabled) {
        await this.logout();
        return false;
      }
      if (licenseData.expiresAt && new Date(licenseData.expiresAt) < new Date()) {
        await this.logout();
        return false;
      }
      const deviceId = await this.getDeviceId();
      this.updateDeviceLastSeen(licenseKey, deviceId).catch(() => {});
      return true;
    }

    async hasValidLicense() {
      const result = await webLicenseStorage.get(['licenseKey', 'deviceId', '_ls']);
      if (!result.licenseKey || !result._ls) return false;
      const deviceId = result.deviceId || await this.getDeviceId();
      return this._verify(result.licenseKey, deviceId, result._ls);
    }

    async logout() {
      await webLicenseStorage.remove(['licenseKey', 'licenseData', 'licensedAt', '_ls']);
      this.isLicensed = false;
      this.licenseData = null;
    }

    async getCurrentLicense() {
      return webLicenseStorage.get(['licenseKey', 'licenseData']);
    }

    async getDevicesList(licenseKey) {
      try {
        const response = await fetch(`${FIREBASE_DB_URL}/licenses/${licenseKey}/devices.json`);
        const devices = await response.json();
        return devices || {};
      } catch (e) {
        console.error('[License] Get devices error:', e);
        return {};
      }
    }

    async removeDevice(licenseKey, deviceIdToRemove) {
      try {
        const resp = await fetch(`${FIREBASE_DB_URL}/licenses/${licenseKey}/devices/${deviceIdToRemove}.json`, {
          method: 'DELETE'
        });
        if (!resp.ok) return { success: false, error: `Server error: HTTP ${resp.status}` };
        return { success: true, message: 'ลบ Device สำเร็จ' };
      } catch (e) {
        return { success: false, error: 'ไม่สามารถลบ Device ได้' };
      }
    }

    async getCurrentDeviceId() {
      return await this.getDeviceId();
    }
  }

  window.licenseService = new LicenseService();
})();
