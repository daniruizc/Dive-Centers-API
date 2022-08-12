export const checkIdExists = async (id, model) => {
    const obj = await model.findById(id);
    if (!obj) return false;
    return true;
};