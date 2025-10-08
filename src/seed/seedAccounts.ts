import mongoose from "mongoose";
import dotenv from "dotenv";
import Account from "../models/Accounts";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/star3ai";

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const userId = '68be91e7d6bbac4bd351d32d' // tạm user giả

    // Facebook Profile 1
    const fbProfile1 = await Account.create({
      user: userId,
      provider: "facebook",
      providerId: "fb_user_001",
      name: "Nguyễn Văn A",
      avatar: "https://graph.facebook.com/fb_user_001/picture",
      type: "profile",
    });

    // Pages của Profile 1
    await Account.create([
      {
        user: userId,
        provider: "facebook",
        providerId: "fb_page_001",
        name: "Shop Quần Áo A",
        avatar: "https://graph.facebook.com/fb_page_001/picture",
        type: "page",
        parentAccount: fbProfile1._id,
      },
      {
        user: userId,
        provider: "facebook",
        providerId: "fb_page_002",
        name: "Sneaker Store A",
        avatar: "https://graph.facebook.com/fb_page_002/picture",
        type: "page",
        parentAccount: fbProfile1._id,
      },
    ]);

    // Facebook Profile 2
    const fbProfile2 = await Account.create({
      user: userId,
      provider: "facebook",
      providerId: "fb_user_002",
      name: "Trần Thị B",
      avatar: "https://graph.facebook.com/fb_user_002/picture",
      type: "profile",
    });

    // Pages của Profile 2
    await Account.create([
      {
        user: userId,
        provider: "facebook",
        providerId: "fb_page_003",
        name: "Spa Làm Đẹp B",
        avatar: "https://graph.facebook.com/fb_page_003/picture",
        type: "page",
        parentAccount: fbProfile2._id,
      },
      {
        user: userId,
        provider: "facebook",
        providerId: "fb_page_004",
        name: "Thời Trang Nữ B",
        avatar: "https://graph.facebook.com/fb_page_004/picture",
        type: "page",
        parentAccount: fbProfile2._id,
      },
      {
        user: userId,
        provider: "facebook",
        providerId: "fb_page_005",
        name: "Phụ Kiện Thời Trang B",
        avatar: "https://graph.facebook.com/fb_page_005/picture",
        type: "page",
        parentAccount: fbProfile2._id,
      },
    ]);

    // TikTok Profile
    await Account.create({
      user: userId,
      provider: "tiktok",
      providerId: "tik_user_001",
      name: "TikTok Fashion",
      avatar: "https://tiktokcdn.com/avatar.jpg",
      type: "profile",
    });

    console.log("🚀 Sample accounts inserted!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding accounts:", err);
    process.exit(1);
  }
};

seed();
