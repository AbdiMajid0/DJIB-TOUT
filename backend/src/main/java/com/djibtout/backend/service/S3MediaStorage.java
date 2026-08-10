package com.djibtout.backend.service;
import org.springframework.beans.factory.annotation.Value;import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.*;import software.amazon.awssdk.core.sync.RequestBody;import software.amazon.awssdk.regions.Region;import software.amazon.awssdk.services.s3.S3Client;import software.amazon.awssdk.services.s3.S3ClientBuilder;import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import java.net.URI;
@Service @ConditionalOnProperty(name="app.media.storage",havingValue="s3") public class S3MediaStorage implements MediaStorage{
 private final S3Client client;private final String bucket,publicBase;
 public S3MediaStorage(@Value("${app.media.s3.endpoint:}")String endpoint,@Value("${app.media.s3.region}")String region,@Value("${app.media.s3.bucket}")String bucket,@Value("${app.media.s3.public-base-url}")String publicBase,@Value("${app.media.s3.access-key}")String access,@Value("${app.media.s3.secret-key}")String secret){S3ClientBuilder builder=S3Client.builder().region(Region.of(region)).credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(access,secret)));if(!endpoint.isBlank())builder.endpointOverride(URI.create(endpoint)).forcePathStyle(true);client=builder.build();this.bucket=bucket;this.publicBase=publicBase.replaceAll("/$","");}
 public String store(byte[]content,String name,String type){client.putObject(PutObjectRequest.builder().bucket(bucket).key(name).contentType(type).build(),RequestBody.fromBytes(content));return publicBase+"/"+name;}
}
