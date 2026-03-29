export default {
    applyRules: (transaction, rules) => {
        const tags = [];
        rules.forEach(rule => {
            const { _id, keywords, tag } = rule;
            transaction.appliedRules = transaction.appliedRules || {};
            if (transaction.appliedRules[_id] == 0) return;
            const description = transaction.description || "";
            const matched = _.some(keywords, (kw) => {
                if (kw.caseSensitive) return description.includes(kw.value);
                return _.toLower(description).includes(_.toLower(kw.value));
            });
            if (matched) {
                transaction.appliedRules[_id] = 1;
                tags.push(tag);
            }
        });
        transaction.tags = tags;
    },
}
