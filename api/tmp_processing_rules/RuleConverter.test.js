const RuleConverter = require('./RuleConverter');

describe('RuleConverter', () => {
    let ruleConverter;

    beforeEach(() => {
        ruleConverter = new RuleConverter();
    });

    test('converts simple exact match', () => {
        const rule = "description: prime video; amount: <=30";
        const expected = "description = 'prime video' AND amount <= 30";
        expect(ruleConverter.convertV1toV2(rule)).toBe(expected);
    });

    test('converts complex OR conditions', () => {
        const rule = "description: st vin de paul|st vincent de paul";
        const expected = "(description = 'st vin de paul' OR description = 'st vincent de paul')";
        expect(ruleConverter.convertV1toV2(rule)).toBe(expected);
    });

    test('converts regex patterns', () => {
        const rule = "description: ama?zo?n";
        const expected = "description = /ama?zo?n/";
        expect(ruleConverter.convertV1toV2(rule)).toBe(expected);
    });

    test('handles escaped characters implying exact match', () => {
        const rule = "description: airtasker\\*";
        const expected = "description = 'airtasker*'";
        expect(ruleConverter.convertV1toV2(rule)).toBe(expected);
    });

    test('handles mixed conditions with AND logic', () => {
        const rule = "description: amazon marketplace; description: <>prime";
        const expected = "description = 'amazon marketplace' AND description <> 'prime'";
        expect(ruleConverter.convertV1toV2(rule)).toBe(expected);
    });

    test('handles not equals and special characters', () => {
        const rule = "description: NEVAGO PTY LTD|EMAA ENTERPRISES P NORTHBRIDGE AUS|just ?cuts";
        const expected = "(description = 'NEVAGO PTY LTD' OR description = 'EMAA ENTERPRISES P NORTHBRIDGE AUS' OR description = /just ?cuts/)";
        expect(ruleConverter.convertV1toV2(rule)).toBe(expected);
    });

    test('converts comparison operators', () => {
        const rule = "debit: <200; debit: >=200; amount: >200";
        const expected = "debit < 200 AND debit >= 200 AND amount > 200";
        expect(ruleConverter.convertV1toV2(rule)).toBe(expected);
    });

    test('handles mixed string and regex matching', () => {
        const rule = "description: TRAVELING ?MAILBOX|TRAVELING M PRIVACYCOM";
        const expected = "(description = /TRAVELING ?MAILBOX/ OR description = 'TRAVELING M PRIVACYCOM')";
        expect(ruleConverter.convertV1toV2(rule)).toBe(expected);
    });

    test('handles explicit regex match', () => {
        const rule = 'description: \\besta\\b';
        const expected = 'description = /\\besta\\b/';
        expect(ruleConverter.convertV1toV2(rule)).toBe(expected);
    });

    test('handles explicit regex match', () => {
        const rule = 'description:^B \\d; account:1547';
        const expected = 'description = /^B \\d/ AND account = \'1547\'';
        expect(ruleConverter.convertV1toV2(rule)).toBe(expected);
    });
});

