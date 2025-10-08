import mongoose,{Schema, Document} from "mongoose";
export interface ITemplate extends Document {
    id: string;
    name: string;
    description: string;
    prompt: string;
}

const TemplateSchema: Schema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    prompt: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model<ITemplate>("Template", TemplateSchema);