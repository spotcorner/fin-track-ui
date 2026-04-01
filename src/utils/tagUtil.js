const resolveLinkedTags = (matchedIds, tags, appliedTags) => {
    const visited = new Set(matchedIds);
    const queue = [...matchedIds];
    while (queue.length > 0) {
        const id = queue.shift();
        tags.forEach(tag => {
            if (!visited.has(tag._id) && tag.linkedTags?.includes(id) && appliedTags[tag._id] !== 0) {
                visited.add(tag._id);
                appliedTags[tag._id] = 3;
                queue.push(tag._id);
            }
        });
    }
};

export default {
    applyTags: (transaction, tags) => {
        if (!transaction._appliedTags) {
            transaction._appliedTags = { ...transaction.appliedTags };
        }
        transaction.appliedTags = { ...transaction._appliedTags };
        const matchedIds = [];
        tags.forEach(tag => {
            const { _id, rules } = tag;
            if (transaction.appliedTags[_id] == 0) return;
            if (transaction.appliedTags[_id] == 1) { matchedIds.push(_id); return; }
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
                matchedIds.push(_id);
            }
        });
        resolveLinkedTags(matchedIds, tags, transaction.appliedTags);
    },
}
