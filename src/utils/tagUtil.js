export default {
    applyTags: (transaction, tags) => {
        if (!transaction._appliedTags) {
            transaction._appliedTags = { ...transaction.appliedTags };
        }
        transaction.appliedTags = { ...transaction._appliedTags };
        const tagNames = [];
        tags.forEach(tag => {
            const { _id, rules, name } = tag;
            if (transaction.appliedTags[_id] == 0) return;
            if (transaction.appliedTags[_id] == 1) { tagNames.push(name); return; }
            const matched = _.some(rules, (rule) => {
                const description = transaction.description || "";
                if (rule.type === "keyword") {
                    if (rule.caseSensitive) return description.includes(rule.value);
                    return _.toLower(description).includes(_.toLower(rule.value));
                }
                if (rule.type === "pattern") {
                    try {
                        const flags = rule.caseSensitive ? "" : "i";
                        return new RegExp(rule.value, flags).test(description);
                    } catch (e) { return false; }
                }
                return false;
            });
            if (matched) {
                transaction.appliedTags[_id] = 2;
                tagNames.push(name);
            }
        });
        transaction.tagNames = tagNames;
    },
}
