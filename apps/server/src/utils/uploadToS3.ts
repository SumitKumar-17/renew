import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { env } from "../config/env";
import { AppError } from "./AppError";

const s3 = new S3Client({
    region: env.AWS_REGION,
    credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
});

interface UploadResult {
    url: string;
    key: string;
}

export const uploadToS3 = async (
    buffer: Buffer,
    folder: string,
    filename: string,
    mimeType: string
): Promise<UploadResult> => {
    const key = `${folder}/${Date.now()}-${filename}`;
    console.log(`[S3] Uploading → bucket=${env.S3_BUCKET_NAME} region=${env.AWS_REGION} key=${key} size=${buffer.length}b mime=${mimeType}`);
    try {
        const upload = new Upload({
            client: s3,
            params: {
                Bucket: env.S3_BUCKET_NAME,
                Key: key,
                Body: buffer,
                ContentType: mimeType,
            },
        });

        await upload.done();

        const url = `https://${env.S3_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
        console.log(`[S3] Upload success → ${url}`);

        return { url, key };
    } catch (err: any) {
        console.error(`[S3] Upload FAILED:`, err?.message ?? err);
        console.error(`[S3] Error code:`, err?.Code ?? err?.code);
        throw AppError.internal("Photo upload failed");
    }
};

export const deleteFromS3 = async (key: string): Promise<void> => {
    try {
        await s3.send(new DeleteObjectCommand({
            Bucket: env.S3_BUCKET_NAME,
            Key: key,
        }));
    } catch (err) {
        // Log but don't throw — deletion failure is not critical
        console.error("S3 delete failed:", err);
    }
};