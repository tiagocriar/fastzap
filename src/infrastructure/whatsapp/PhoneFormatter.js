export class PhoneFormatter {
  static toJid(phone) {
    const digits = phone.replace(/\D/g, "");
    return `${digits}@s.whatsapp.net`;
  }

  static toGroupJid(jid) {
    return jid.includes("@") ? jid : `${jid}@g.us`;
  }

  static fromJid(jid) {
    return jid.split("@")[0];
  }

  static isGroup(jid) {
    return jid.endsWith("@g.us");
  }
}
