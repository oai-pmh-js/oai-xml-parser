import { X2jOptionsOptional, XMLParser } from 'fast-xml-parser';
import { IOaiPmhParser, OaiPmhError } from '@oai-pmh-js/oai-pmh';
import { VerbsAndFields } from '@oai-pmh-js/oai-pmh/dist/type/general';

export class OaiPmhParser implements IOaiPmhParser {
  private readonly parserOptions: X2jOptionsOptional = {
    ignoreAttributes: false,
    parseAttributeValue: false,
    trimValues: false,
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

  public GetResumptionToken(result: any) {
    const token: string = result.resumptionToken['#text'];
    return token ?? null;
  }

  public ParseOaiPmhXml(xml: string) {
    const obj = this.xmlParser.parse(xml);
    const oaiPmh = obj['OAI-PMH'];
    if (!oaiPmh)
      throw new OaiPmhError('Returned data does not conform to OAI-PMH');
    if (oaiPmh.error)
      throw new OaiPmhError(
        `OAI-PMH provider returned an error: ${
          oaiPmh.error['#text']
            ? oaiPmh.error['#text'] + ' | ' + oaiPmh.error['@_code']
            : oaiPmh.error['@_code']
        }`,
      );
    return oaiPmh;
  }

  public ParseIdentify(obj: any) {
    return obj.Identify;
  }

  public ParseMetadataFormats(obj: any) {
    return obj.ListMetadataFormats.metadataFormat;
  }

  public ParseRecord(obj: any) {
    return obj.GetRecord.record;
  }

  public *ParseList<T extends keyof VerbsAndFields>(
    obj: any,
    verb: T,
    field: VerbsAndFields[T],
  ) {
    if (obj[verb])
      for (const item of Array.isArray(obj[verb][field])
        ? obj[verb][field]
        : [obj[verb][field]])
        yield item;
  }
}
