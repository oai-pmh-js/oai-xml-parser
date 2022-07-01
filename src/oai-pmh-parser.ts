import { X2jOptionsOptional, XMLParser } from 'fast-xml-parser';
import { OaiPmhParserInterface, OaiPmhError } from '@oai-pmh-js/oai-pmh';
import { VerbsAndFieldsForList } from '@oai-pmh-js/oai-pmh/dist/model/general';

export class OaiPmhParser implements OaiPmhParserInterface {
  private readonly parserOptions: X2jOptionsOptional = {
    ignoreAttributes: false,
    parseAttributeValue: false,
    trimValues: true,
    processEntities: true,
    parseTagValue: false,
  };
  private readonly xmlParser: XMLParser;

  /**
   * @param parserOptions Options for [XMLParser](https://github.com/NaturalIntelligence/fast-xml-parser).
   * It's possible that parserOptions will break
   * the methods of this class. If you need options that
   * do break current methods, either extend this class or do your
   * own implementation of the interface from the [core package](https://github.com/oai-pmh-js/oai-pmh).
   */
  constructor(parserOptions?: X2jOptionsOptional) {
    if (parserOptions) this.parserOptions = parserOptions;
    this.xmlParser = new XMLParser(this.parserOptions);
  }

  public parseResumptionToken(
    value: any,
    verb: keyof VerbsAndFieldsForList,
  ): string | null {
    return (
      value[verb].resumptionToken?.['#text'] ??
      value[verb].resumptionToken ??
      null
    );
  }

  public parseOaiPmhXml(xml: string) {
    const obj = this.xmlParser.parse(xml);
    const oaiPmh = obj['OAI-PMH'];
    if (!oaiPmh)
      throw new OaiPmhError('Returned data does not conform to OAI-PMH');
    if (oaiPmh.error)
      throw new OaiPmhError(
        `OAI-PMH provider returned an error: ${
          oaiPmh.error?.['#text']
            ? oaiPmh.error?.['#text'] + ' | ' + oaiPmh.error?.['@_code']
            : oaiPmh.error?.['@_code']
        }`,
      );
    return oaiPmh;
  }

  public parseIdentify(value: any) {
    return value.Identify;
  }

  public parseMetadataFormats(value: any) {
    return value.ListMetadataFormats.metadataFormat;
  }

  public parseRecord(value: any) {
    return value.GetRecord.record;
  }

  public *parseList<
    T extends keyof VerbsAndFieldsForList = keyof VerbsAndFieldsForList,
  >(value: any, verb: T, field: VerbsAndFieldsForList[T]) {
    if (value[verb])
      for (const item of Array.isArray(value[verb]?.[field])
        ? value[verb][field]
        : [value[verb]?.[field]])
        yield item;
  }
}
