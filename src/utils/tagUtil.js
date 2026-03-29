export default {
    applyTags: (transaction, tags) => {
        const tagNames = [];
        tags.forEach(tag => {
            const { _id, rules, name } = tag;
            transaction.appliedTags = transaction.appliedTags || {};
            if (transaction.appliedTags[_id] == 0) return;
            if (transaction.appliedTags[_id] == 1) { tagNames.push(name); return; }
            const description = transaction.description || "";
            const matched = _.some(rules, (rule) => {
                if (rule.type !== "keyword") return false;
                if (rule.caseSensitive) return description.includes(rule.value);
                return _.toLower(description).includes(_.toLower(rule.value));
            });
            if (matched) {
                transaction.appliedTags[_id] = 1;
                tagNames.push(name);
            }
        });
        transaction.tagNames = tagNames;
    },
}
