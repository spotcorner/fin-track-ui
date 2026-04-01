const resolveLinkedTags = (matchedIds, tags, appliedTags, tagNames) => {
    const visited = new Set(matchedIds);
    const queue = [...matchedIds];
    while (queue.length > 0) {
        const id = queue.shift();
        tags.forEach(tag => {
            if (!visited.has(tag._id) && tag.linkedTags?.includes(id) && appliedTags[tag._id] !== 0) {
                visited.add(tag._id);
                appliedTags[tag._id] = 3;
                tagNames.push(tag.name);
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
        const tagNames = [];
        const matchedIds = [];
        tags.forEach(tag => {
            const { _id, rules, name } = tag;
            if (transaction.appliedTags[_id] == 0) return;
            if (transaction.appliedTags[_id] == 1) { tagNames.push(name); matchedIds.push(_id); return; }
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
                matchedIds.push(_id);
            }
        });
        resolveLinkedTags(matchedIds, tags, transaction.appliedTags, tagNames);
        transaction.tagNames = tagNames;
    },
}
