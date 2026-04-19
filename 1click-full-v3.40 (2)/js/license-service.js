// License Service - ระบบตรวจสอบ License Key ด้วย Firebase
// 1 License Key = 4 Devices

class LicenseService {
  constructor() {
    this.isLicensed = false;
    this.licenseData = null;
    this.deviceId = null;
    this.maxDevices = 4;
    // ★ HMAC secret สำหรับ sign license data — ป้องกัน storage tampering ★
    this._hs = [0x4c,0x69,0x63,0x5f,0x53,0x31,0x67,0x6e,0x5f,0x4b,0x33,0x79,0x5f,0x32,0x30,0x32,0x36].map(c => String.fromCharCode(c)).join('');
  }

  // ★ HMAC-like signature — ป้องกัน fake license ใน storage ★
  _sign(licenseKey, deviceId) {
    const data = licenseKey + '|' + deviceId + '|' + this._hs;
    let hash = 0x811c9dc5;
    for (let i = 0; i < data.length; i++) {
      hash ^= data.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(36);
  }

  // ★ Verify signature ★
  _verify(licenseKey, deviceId, signature) {
    return this._sign(licenseKey, deviceId) === signature;
  }

  // สร้าง Device ID จาก Chrome Profile (unique per profile)
  async getDeviceId() {
    if (this.deviceId) return this.deviceId;
    
    try {
      // ใช้ chrome.storage.local เพื่อให้ unique ต่อ profile
      const result = await chrome.storage.local.get(['deviceId']);
      
      if (result.deviceId) {
        this.deviceId = result.deviceId;
      } else {
        // สร้าง Device ID ใหม่
        this.deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11);
        await chrome.storage.local.set({ deviceId: this.deviceId });
      }
      
      return this.deviceId;
    } catch (e) {
      console.error('[License] Error getting device ID:', e);
      return 'unknown_device';
    }
  }

  // ตรวจสอบ License Key กับ Firebase
  async validateLicense(licenseKey) {
    if (!licenseKey || licenseKey.trim() === '') {
      return { success: false, error: 'กรุณาใส่ License Key' };
    }

    const deviceId = await this.getDeviceId();
    const cleanKey = licenseKey.trim().toUpperCase();

    try {
      // ดึงข้อมูล License จาก Firebase
      const response = await fetch(`${FIREBASE_DB_URL}/licenses/${cleanKey}.json`);
      
      if (!response.ok) {
        return { success: false, error: 'ไม่สามารถเชื่อมต่อ Server ได้' };
      }

      const licenseData = await response.json();

      // ไม่พบ License Key
      if (!licenseData) {
        return { success: false, error: 'License Key ไม่ถูกต้อง' };
      }

      // ตรวจสอบว่า License หมดอายุหรือไม่
      if (licenseData.expiresAt && new Date(licenseData.expiresAt) < new Date()) {
        return { success: false, error: 'License Key หมดอายุแล้ว' };
      }

      // ตรวจสอบว่า License ถูก disable หรือไม่
      if (licenseData.disabled) {
        return { success: false, error: 'License Key ถูกระงับการใช้งาน' };
      }

      // ตรวจสอบจำนวน devices
      const devices = licenseData.devices || {};
      const deviceIds = Object.keys(devices);
      
      // ถ้า device นี้เคยลงทะเบียนแล้ว
      if (devices[deviceId]) {
        // อัพเดท last seen
        await this.updateDeviceLastSeen(cleanKey, deviceId);
        
        this.isLicensed = true;
        this.licenseData = licenseData;
        
        // บันทึก License ลง local storage
        await this.saveLicenseLocal(cleanKey, licenseData);
        
        return { 
          success: true, 
          message: 'ยินดีต้อนรับกลับ!',
          devicesUsed: deviceIds.length,
          maxDevices: this.maxDevices
        };
      }

      // ถ้ายังไม่เคยลงทะเบียน - ตรวจสอบว่าเต็มหรือยัง
      if (deviceIds.length >= this.maxDevices) {
        return { 
          success: false, 
          error: `License Key นี้ใช้งานครบ ${this.maxDevices} โปรไฟล์แล้ว`,
          devicesUsed: deviceIds.length,
          maxDevices: this.maxDevices
        };
      }

      // ลงทะเบียน device ใหม่
      await this.registerDevice(cleanKey, deviceId);
      
      this.isLicensed = true;
      this.licenseData = licenseData;
      
      // บันทึก License ลง local storage
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

  // ลงทะเบียน Device ใหม่
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

  // อัพเดท last seen ของ device
  async updateDeviceLastSeen(licenseKey, deviceId) {
    const resp = await fetch(`${FIREBASE_DB_URL}/licenses/${licenseKey}/devices/${deviceId}/lastSeen.json`, {
      method: 'PUT',
      body: JSON.stringify(new Date().toISOString())
    });
    if (!resp.ok) console.warn('[License] updateDeviceLastSeen HTTP', resp.status);
  }

  // บันทึก License ลง Local Storage (★ พร้อม HMAC signature ★)
  async saveLicenseLocal(licenseKey, licenseData) {
    const deviceId = await this.getDeviceId();
    const sig = this._sign(licenseKey, deviceId);
    await chrome.storage.local.set({
      licenseKey: licenseKey,
      licenseData: licenseData,
      licensedAt: new Date().toISOString(),
      deviceId: deviceId,
      _ls: sig  // ★ HMAC signature — ป้องกัน fake key ★
    });
    console.log('[License] Saved license to local storage with deviceId:', deviceId);
  }

  // โหลด License จาก Local Storage (★ ต้อง verify HMAC + validate กับ server ★)
  async loadLocalLicense() {
    try {
      const result = await chrome.storage.local.get(['licenseKey', 'licenseData', 'licensedAt', 'deviceId', '_ls']);
      
      console.log('[License] Loading local license:', result.licenseKey ? 'Found' : 'Not found');
      
      if (result.licenseKey) {
        // Get or create deviceId
        if (result.deviceId) {
          this.deviceId = result.deviceId;
        } else {
          this.deviceId = await this.getDeviceId();
          await chrome.storage.local.set({ deviceId: this.deviceId });
        }
        
        // ★ Step 1: Verify HMAC signature — ป้องกัน fake key ใน storage ★
        if (!result._ls || !this._verify(result.licenseKey, this.deviceId, result._ls)) {
          console.log('[License] ⚠️ Signature mismatch — possible tampering!');
          await this.logout();
          return { success: false, error: 'License ไม่ถูกต้อง กรุณาลงทะเบียนใหม่' };
        }
        
        // ★ Step 2: Validate กับ Firebase server (บังคับ — ไม่ trust cache) ★
        try {
          const serverValid = await this.backgroundValidate(result.licenseKey);
          if (serverValid === false) {
            console.log('[License] ⚠️ Server validation failed — license revoked');
            return { success: false, error: 'License ถูกระงับหรือหมดอายุ' };
          }
        } catch (e) {
          // ★ Offline fallback: ถ้าเน็ตไม่มี ให้ใช้ cache ได้ แต่ต้องมี signature ถูก ★
          console.log('[License] Server unreachable, using signed cache');
        }
        
        this.isLicensed = true;
        this.licenseData = result.licenseData;
        
        return { 
          success: true, 
          message: 'ยินดีต้อนรับกลับ!',
          fromCache: true
        };
      }
      
      return { success: false, error: 'ยังไม่ได้ลงทะเบียน License' };
    } catch (e) {
      console.error('[License] Load local error:', e);
      return { success: false, error: 'เกิดข้อผิดพลาด' };
    }
  }

  // Background validate (ไม่ block UI)
  async backgroundValidate(licenseKey) {
    try {
      const response = await fetch(`${FIREBASE_DB_URL}/licenses/${licenseKey}.json`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const licenseData = await response.json();
      
      if (!licenseData || licenseData.disabled) {
        await this.logout();
        return false;
      }
      
      // ตรวจ expiresAt ให้ตรงกับ validateLicense
      if (licenseData.expiresAt && new Date(licenseData.expiresAt) < new Date()) {
        await this.logout();
        return false;
      }
      
      const deviceId = await this.getDeviceId();
      this.updateDeviceLastSeen(licenseKey, deviceId).catch(() => {});
      
      return true;
    } catch (e) {
      // Network error → throw เพื่อให้ loadLocalLicense ใช้ offline fallback
      console.log('[License] Background validate network error:', e);
      throw e;
    }
  }

  // ตรวจสอบว่ามี License หรือไม่ (★ verify HMAC signature ด้วย ★)
  async hasValidLicense() {
    const result = await chrome.storage.local.get(['licenseKey', 'deviceId', '_ls']);
    if (!result.licenseKey || !result._ls) return false;
    const deviceId = result.deviceId || await this.getDeviceId();
    return this._verify(result.licenseKey, deviceId, result._ls);
  }

  // Logout - ลบ License ออกจาก local
  async logout() {
    await chrome.storage.local.remove(['licenseKey', 'licenseData', 'licensedAt', '_ls']);
    this.isLicensed = false;
    this.licenseData = null;
  }

  // ดึงข้อมูล License ปัจจุบัน
  async getCurrentLicense() {
    const result = await chrome.storage.local.get(['licenseKey', 'licenseData']);
    return result;
  }

  // ★ ดึงรายการ devices ทั้งหมดของ License ★
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

  // ★ ลบ device ออกจาก License ★
  async removeDevice(licenseKey, deviceIdToRemove) {
    try {
      const resp = await fetch(`${FIREBASE_DB_URL}/licenses/${licenseKey}/devices/${deviceIdToRemove}.json`, {
        method: 'DELETE'
      });
      if (!resp.ok) return { success: false, error: `Server error: HTTP ${resp.status}` };
      return { success: true, message: 'ลบ Device สำเร็จ' };
    } catch (e) {
      console.error('[License] Remove device error:', e);
      return { success: false, error: 'ไม่สามารถลบ Device ได้' };
    }
  }

  // ★ ดึง Device ID ปัจจุบัน ★
  async getCurrentDeviceId() {
    return await this.getDeviceId();
  }
}

// สร้าง instance
const licenseService = new LicenseService();
