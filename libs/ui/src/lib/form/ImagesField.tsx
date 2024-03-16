import Image, { ImageLoader } from 'next/image';
import { FilesField, FilesFieldProps } from './FilesField';

type UiProps = Omit<NonNullable<FilesFieldProps['ui']>, 'addFileButtonLabel'>;
type Props = Omit<FilesFieldProps, 'acceptFileType' | 'multiple' | 'ui' | 'renderFile'> & {
  ui?: UiProps;
  imageLoader?: ImageLoader;
};

export function ImagesField({ imageLoader, ...props }: Props) {
  return (
    <FilesField
      {...props}
      acceptFileType="image/*"
      multiple
      ui={{
        ...props.ui,
        addFileButtonLabel: 'Ajouter une image',
      }}
      renderFile={(file, size) => {
        return (
          <Image
            src={file.url}
            width={size[0]}
            height={size[1]}
            alt=""
            className="object-contain object-center bg-gray-50"
            style={{ width: size[0], height: size[1] }}
            loader={file.uid.startsWith('uploaded') ? undefined : imageLoader}
          />
        );
      }}
    />
  );
}
