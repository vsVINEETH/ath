const userModel = require("../../models/user");
require("dotenv").config();

const customers = async (req, res) => {
  try {
    const customerData = await userModel.find({});
    if (customerData) {
      return res.render("admin/users", { customerData });
    }
  } catch (error) {
    console.error("customers entry issue", error);
    return res.status(404).render("admin/error-page");
  }
};

const customerAction = async (req, res) => {
  try {
    const userId = req.params.user_id;
    const foundCustomer = await userModel.findById(userId);

    if (!foundCustomer) {
      return res.status(404).render("admin/error-page");
    }

    foundCustomer.is_block = !foundCustomer.is_block;
    await foundCustomer.save();

    return res.status(200).json({
      success: true,
      is_block: foundCustomer.is_block,
      user_id: foundCustomer._id,
    });

   // return res.redirect("/admin/customers");
  } catch (error) {
    console.error("customerAction entry issue", error);
    return res.status(404).render("admin/error-page");
  }
};

module.exports = {
  customers,
  customerAction,
};

