class RuleConverter {
    constructor() {
        this.ruleComponents = {};
    }

    parseRule(rule) {
        if (this.ruleComponents[rule]) {
            return this.ruleComponents[rule];
        } else {
            const components = rule.split(/\s*[;\n]\s*/).map(component => {
                const [field, pattern] = component.split(/\s*:\s*/).map(str => str.trim());
                return { field, pattern };
            });
            return this.ruleComponents[rule] = components;
        }
    }

    convertV1toV2(rule) {
        const components = this.parseRule(rule);
        return components.map(({ field, pattern }) => {
            return this.convertCondition(field, pattern);
        }).join(' AND ');
    }

    convertCondition(field, pattern) {
        if (pattern.includes('|')) {
            const values = pattern.split('|').map(val => this.simpleMatch(field, val));
            return `(${values.join(' OR ')})`;
        } else {
            return this.simpleMatch(field, pattern);
        }
    }

    simpleMatch(field, value) {

         if (/^<>/.test(value)) {
            // const operator = value.match(/^[<>]/)[0];
            const v = value.slice(2).trim();
            // return `${field} ${operator} ${numValue}`;

            return `${field} <> '${v}'`;

        }

        // Handle comparison operators
        else if (/^[<>]=?/.test(value)) {
            const operator = value.match(/^[<>]=?/)[0];
            const numValue = value.slice(operator.length).trim();
            return `${field} ${operator} ${numValue}`;
        }

        // Detect regex or literal based on escaping and special characters
        if (this.isRegex(value)) {
            // Prepare the regex string correctly handling escaped characters
            const regexString = value.replace(/\\([bBdDsSwW])/g, '\\$1')  // Keep regex escapes
                                    .replace(/\\([^bBdDsSwW])/g, '$1');  // Convert literal escapes
            return `${field} = /${regexString}/`;
        }
        
        // Assume exact match if no special regex characters
        return `${field} = '${value.replace(/\\(.)/g, '$1')}'`;  // Unescape non-regex characters
    }

    isRegex(value) {
        // Check if there are unescaped regex characters or specific regex escapes
        return /(^|[^\\])([\?\^\$\.\[\]\{\}\(\)\|])|\\[bBdDsSwW]/.test(value);
    }
}

module.exports = RuleConverter;
